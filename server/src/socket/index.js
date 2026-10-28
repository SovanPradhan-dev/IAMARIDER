import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  upsertLiveLocation, stopSharing, freshnessStatus, LOCATION_CONFIG,
} from '../services/locationService.js';
import { createMessage } from '../services/messageService.js';
import { reportArrival } from '../services/checkpointService.js';
import { createEmergency } from '../services/emergencyService.js';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { Message } from '../models/Message.js';
import { EmergencyEvent } from '../models/EmergencyEvent.js';
import { CheckpointArrival } from '../models/CheckpointArrival.js';
import { LiveLocation } from '../models/LiveLocation.js';
import { z } from 'zod';

/**
 * Per-user in-memory event rate limiting (simple sliding counter).
 * Sufficient for a single-node server; use Redis-backed adapter for multi-node.
 */
const userEventCounts = new Map(); // userId => { windowStart, counts: Map(event, n) }
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_EVENTS_PER_WINDOW = 120;

const checkRateLimit = (userId, event) => {
  const now = Date.now();
  let state = userEventCounts.get(userId);
  if (!state || now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
    state = { windowStart: now, counts: new Map() };
    userEventCounts.set(userId, state);
  }
  const n = (state.counts.get(event) || 0) + 1;
  state.counts.set(event, n);
  return n <= MAX_EVENTS_PER_WINDOW;
};

// Socket payload schemas
const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(10000).optional(),
  speedMps: z.number().min(0).max(500).optional(),
  headingDegrees: z.number().min(0).max(360).optional(),
  recordedAt: z.string().datetime().optional(),
});

const messageSendSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

const emergencyCreateSchema = z.object({
  eventType: z.enum(['sos', 'breakdown', 'medical', 'other']),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const initSocket = (io) => {
  // Authentication middleware for every connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Access token expired'));
      }
      return next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const activeTrips = new Set(); // tripIds this socket is currently in

    logger.info('socket connected', { userId, socketId: socket.id });

    // Helper: verify membership and join room
    const ensureMembership = async (tripId) => {
      const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
      if (!membership) {
        throw new Error('Not a member of this trip');
      }
      return membership;
    };

    // --- trip:join ---
    socket.on('trip:join', async (data, ack) => {
      try {
        if (!checkRateLimit(userId, 'trip:join')) {
          return ack?.({ error: 'Rate limited' });
        }
        const { tripId } = z.object({ tripId: z.string().min(1) }).parse(data);
        await ensureMembership(tripId);

        socket.join(tripId);
        activeTrips.add(tripId);

        // Broadcast member joined to others in the room
        socket.to(tripId).emit('trip:member:joined', { tripId, userId });

        // Load current locations snapshot for the requester
        const locations = await LiveLocation.find({ tripId }).lean();
        const members = await TripMember.find({ tripId, status: 'joined' })
          .populate('userId', 'name avatarUrl')
          .lean();

        return ack?.({
          ok: true,
          tripId,
          locations,
          members,
        });
      } catch (err) {
        logger.warn('trip:join error', { userId, error: err.message });
        return ack?.({ error: err.message || 'Failed to join trip' });
      }
    });

    // --- trip:leave ---
    socket.on('trip:leave', async (data, ack) => {
      try {
        if (!checkRateLimit(userId, 'trip:leave')) {
          return ack?.({ error: 'Rate limited' });
        }
        const { tripId } = z.object({ tripId: z.string().min(1) }).parse(data);
        await ensureMembership(tripId);

        socket.leave(tripId);
        activeTrips.delete(tripId);

        socket.to(tripId).emit('trip:member:left', { tripId, userId });

        return ack?.({ ok: true });
      } catch (err) {
        return ack?.({ error: err.message || 'Failed to leave trip' });
      }
    });

    // --- location:update ---
    socket.on('location:update', async (data, ack) => {
      try {
        if (!checkRateLimit(userId, 'location:update')) {
          return ack?.({ error: 'Rate limited' });
        }
        const { tripId, ...payload } = locationUpdateSchema.parse(data);
        await ensureMembership(tripId);

        const liveLocation = await upsertLiveLocation({ tripId, userId, payload });

        // Broadcast only to members of this trip
        io.to(tripId).emit('location:changed', {
          tripId,
          userId,
          location: liveLocation.location,
          accuracyMeters: liveLocation.accuracyMeters,
          speedMps: liveLocation.speedMps,
          headingDegrees: liveLocation.headingDegrees,
          recordedAt: liveLocation.recordedAt,
          updatedAt: liveLocation.updatedAt,
          freshness: freshnessStatus(liveLocation.updatedAt),
        });

        return ack?.({ ok: true });
      } catch (err) {
        logger.warn('location:update error', { userId, error: err.message });
        return ack?.({ error: err.message || 'Invalid location update' });
      }
    });

    // --- trip:message:send ---
    socket.on('trip:message:send', async (data, ack) => {
      try {
        if (!checkRateLimit(userId, 'trip:message:send')) {
          return ack?.({ error: 'Rate limited' });
        }
        const { tripId, text } = messageSendSchema.parse({ text: data.text, ...(data.tripId ? { tripId } : {}) });
        // messageSendSchema doesn't include tripId; validate separately
        const parsed = z.object({ tripId: z.string().min(1), text: z.string().min(1).max(1000) }).parse(data);
        await ensureMembership(parsed.tripId);

        const message = await createMessage({ tripId: parsed.tripId, senderId: userId, text: parsed.text });

        const populated = await Message.findById(message._id).populate('senderId', 'name avatarUrl').lean();

        io.to(parsed.tripId).emit('trip:message:new', {
          ...populated,
          createdAt: populated.createdAt,
        });

        return ack?.({ ok: true, messageId: message._id });
      } catch (err) {
        logger.warn('trip:message:send error', { userId, error: err.message });
        return ack?.({ error: err.message || 'Failed to send message' });
      }
    });

    // --- checkpoint:arrival ---
    socket.on('checkpoint:arrival', async (data, ack) => {
      try {
        if (!checkRateLimit(userId, 'checkpoint:arrival')) {
          return ack?.({ error: 'Rate limited' });
        }
        const { tripId, checkpointId } = z.object({
          tripId: z.string().min(1),
          checkpointId: z.string().min(1),
        }).parse(data);
        await ensureMembership(tripId);

        const arrival = await reportArrival({ tripId, checkpointId, userId });

        io.to(tripId).emit('checkpoint:arrival:new', {
          ...arrival,
          arrivedAt: arrival.arrivedAt,
        });

        return ack?.({ ok: true });
      } catch (err) {
        logger.warn('checkpoint:arrival error', { userId, error: err.message });
        return ack?.({ error: err.message || 'Failed to report arrival' });
      }
    });

    // --- emergency:create ---
    socket.on('emergency:create', async (data, ack) => {
      try {
        if (!checkRateLimit(userId, 'emergency:create')) {
          return ack?.({ error: 'Rate limited' });
        }
        const { tripId, ...payload } = emergencyCreateSchema.parse(data);
        await ensureMembership(tripId);

        const event = await createEmergency({ tripId, reportedBy: userId, ...payload });

        const populated = await EmergencyEvent.findById(event._id)
          .populate('reportedBy', 'name avatarUrl')
          .lean();

        io.to(tripId).emit('emergency:new', {
          ...populated,
          createdAt: populated.createdAt,
        });

        return ack?.({ ok: true, eventId: event._id });
      } catch (err) {
        logger.warn('emergency:create error', { userId, error: err.message });
        return ack?.({ error: err.message || 'Failed to create emergency event' });
      }
    });

    // --- presence:heartbeat ---
    socket.on('presence:heartbeat', async (data, ack) => {
      try {
        if (!checkRateLimit(userId, 'presence:heartbeat')) {
          return ack?.({ error: 'Rate limited' });
        }
        const { tripId } = z.object({ tripId: z.string().min(1).optional() }).parse(data);
        if (tripId) {
          await ensureMembership(tripId);
          await TripMember.findOneAndUpdate(
            { tripId, userId, status: 'joined' },
            { $set: { lastSeenAt: new Date() } }
          );
        }
        return ack?.({ ok: true, serverTime: new Date().toISOString() });
      } catch (err) {
        return ack?.({ error: err.message || 'Heartbeat failed' });
      }
    });

    // --- disconnect ---
    socket.on('disconnect', (reason) => {
      logger.info('socket disconnected', { userId, socketId: socket.id, reason });
      // Do not mark riders offline here: a page refresh or network blip
      // should not imply the rider has stopped. The client controls sharing.
      activeTrips.clear();
    });
  });
};

export default { initSocket };
