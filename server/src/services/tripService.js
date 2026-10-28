import mongoose from 'mongoose';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { LiveLocation } from '../models/LiveLocation.js';
import { Message } from '../models/Message.js';
import { EmergencyEvent } from '../models/EmergencyEvent.js';
import { Checkpoint } from '../models/Checkpoint.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

const generateTripCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createTrip = async ({ creatorId, ...data }) => {
  let tripCode;
  let attempts = 0;
  while (attempts < 10) {
    tripCode = generateTripCode();
    const exists = await Trip.exists({ tripCode });
    if (!exists) break;
    attempts++;
  }
  if (attempts >= 10) {
    throw new AppError('Unable to generate a unique trip code', 500);
  }

  const session = await mongoose.startSession();
  let createdTrip;
  try {
    await session.withTransaction(async () => {
      const [trip] = await Trip.create([{
        ...data,
        tripCode,
        createdBy: creatorId,
        leaderId: creatorId,
        startLocation: {
          type: 'Point',
          coordinates: [data.startLongitude, data.startLatitude],
        },
        destination: {
          type: 'Point',
          coordinates: [data.destLongitude, data.destLatitude],
        },
      }], { session });

      await TripMember.create([{
        tripId: trip._id,
        userId: creatorId,
        role: 'leader',
        status: 'joined',
      }], { session });

      createdTrip = trip;
    });
  } finally {
    await session.endSession();
  }

  logger.info('trip created', { tripId: createdTrip._id, tripCode, creatorId });
  return await Trip.findById(createdTrip._id);
};

/**
 * Get trips created by or joined by the user.
 */
export const listUserTrips = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [trips, total] = await Promise.all([
    Trip.find({
      $or: [{ createdBy: userId }, { leaderId: userId }],
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Trip.countDocuments({
      $or: [{ createdBy: userId }, { leaderId: userId }],
    }),
  ]);
  return { trips, total, page, limit };
};

/**
 * Get a single trip by its MongoDB _id, with member info.
 */
export const getTripById = async (tripId, userId) => {
  const trip = await Trip.findById(tripId).lean();
  if (!trip) throw new AppError('Trip not found', 404);

  const membership = await TripMember.findOne({ tripId, userId }).lean();
  if (!membership) {
    // Only allow viewing if trip is public
    if (trip.privacy !== 'public') throw new AppError('Not a member of this trip', 403);
  }

  return { trip, isMember: !!membership, membership };
};

/**
 * Join a trip by tripCode. Concurrency-safe against member limits.
 */
export const joinTrip = async (tripCode, userId) => {
  const trip = await Trip.findOne({ tripCode });
  if (!trip) throw new AppError('Invalid trip code', 404);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const existing = await TripMember.findOne({ tripId: trip._id, userId }).session(session);
      if (existing) {
        if (existing.status === 'joined') {
          throw new AppError('You are already a member of this trip', 409);
        }
        // Rejoin: reset status to joined
        existing.status = 'joined';
        existing.joinedAt = new Date();
        await existing.save({ session });
        return;
      }

      // Count active joined members
      const memberCount = await TripMember.countDocuments({
        tripId: trip._id,
        status: 'joined',
      }).session(session);

      if (memberCount >= trip.maxMembers) {
        throw new AppError('Trip has reached its member limit', 403);
      }

      const role = trip.leaderId.toString() === userId.toString() ? 'leader' : 'rider';
      await TripMember.create([{
        tripId: trip._id,
        userId,
        role,
        status: 'joined',
      }], { session });
    });
  } finally {
    await session.endSession();
  }

  logger.info('user joined trip', { tripId: trip._id, tripCode, userId });
  return trip;
};

export const leaveTrip = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);

  if (trip.leaderId.toString() === userId.toString()) {
    throw new AppError('Trip leader cannot leave; transfer leadership or cancel the trip first', 400);
  }

  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' });
  if (!membership) throw new AppError('You are not a member of this trip', 400);

  membership.status = 'left';
  membership.lastSeenAt = new Date();
  await membership.save();

  // Stop location sharing
  await LiveLocation.deleteOne({ tripId, userId });

  logger.info('user left trip', { tripId, userId });
  return trip;
};

export const removeMember = async (tripId, targetUserId, actorId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);
  if (!trip.isLeader(actorId)) throw new AppError('Only the trip leader can remove members', 403);

  if (targetUserId === actorId) {
    throw new AppError('Use leave trip instead', 400);
  }

  const membership = await TripMember.findOne({ tripId, userId: targetUserId, status: 'joined' });
  if (!membership) throw new AppError('User is not a member of this trip', 400);

  membership.status = 'removed';
  membership.lastSeenAt = new Date();
  await membership.save();

  await LiveLocation.deleteOne({ tripId, userId: targetUserId });

  logger.info('member removed', { tripId, targetUserId, actorId });
  return trip;
};

export const updateTrip = async (tripId, actorId, updates) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);
  if (!trip.isLeader(actorId)) throw new AppError('Only the trip leader can edit this trip', 403);

  const allowed = ['name', 'description', 'plannedDepartureAt', 'maxMembers', 'privacy'];
  const set = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) set[key] = updates[key];
  }

  const updated = await Trip.findByIdAndUpdate(tripId, { $set: set }, { new: true });
  logger.info('trip updated', { tripId, actorId, fields: Object.keys(set) });
  return updated;
};

export const startTrip = async (tripId, actorId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);
  if (!trip.isLeader(actorId)) throw new AppError('Only the trip leader can start the trip', 403);
  if (trip.status === 'active') throw new AppError('Trip is already active', 400);
  if (trip.status === 'completed' || trip.status === 'cancelled') {
    throw new AppError('Cannot start a completed or cancelled trip', 400);
  }

  trip.status = 'active';
  trip.startedAt = new Date();
  await trip.save();

  logger.info('trip started', { tripId, actorId });
  return trip;
};

export const endTrip = async (tripId, actorId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);
  if (!trip.isLeader(actorId)) throw new AppError('Only the trip leader can end the trip', 403);
  if (trip.status !== 'active') throw new AppError('Trip is not active', 400);

  trip.status = 'completed';
  trip.endedAt = new Date();
  await trip.save();

  logger.info('trip ended', { tripId, actorId });
  return trip;
};

export const cancelTrip = async (tripId, actorId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);
  if (!trip.isLeader(actorId)) throw new AppError('Only the trip leader can cancel the trip', 403);
  if (trip.status === 'completed' || trip.status === 'cancelled') {
    throw new AppError('Trip cannot be cancelled', 400);
  }

  trip.status = 'cancelled';
  trip.endedAt = new Date();
  await trip.save();

  // Mark all locations offline
  await LiveLocation.updateMany({ tripId }, { $set: { updatedAt: new Date() } });

  logger.info('trip cancelled', { tripId, actorId });
  return trip;
};

export const transferLeadership = async (tripId, actorId, targetUserId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new AppError('Trip not found', 404);
  if (!trip.isLeader(actorId)) throw new AppError('Only the trip leader can transfer leadership', 403);
  if (targetUserId === actorId) throw new AppError('Already the leader', 400);

  const targetMembership = await TripMember.findOne({ tripId, userId: targetUserId, status: 'joined' });
  if (!targetMembership) throw new AppError('Target user is not a member of this trip', 400);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Demote current leader to rider
      await TripMember.findOneAndUpdate(
        { tripId, userId: actorId },
        { $set: { role: 'rider' } },
        { session }
      );
      // Promote target to leader
      targetMembership.role = 'leader';
      await targetMembership.save({ session });

      trip.leaderId = targetUserId;
      await trip.save({ session });
    });
  } finally {
    await session.endSession();
  }

  logger.info('leadership transferred', { tripId, actorId, targetUserId });
  return trip;
};

export const listMembers = async (tripId) => {
  const members = await TripMember.find({ tripId, status: 'joined' })
    .populate('userId', 'name avatarUrl')
    .sort({ role: -1, joinedAt: 1 })
    .lean();
  return members;
};

/**
 * Get latest live locations for all joined members of a trip.
 */
export const getLatestLocations = async (tripId) => {
  const members = await TripMember.find({ tripId, status: 'joined' })
    .populate('userId', 'name avatarUrl')
    .lean();

  const locations = await LiveLocation.find({ tripId }).lean();

  const byUser = {};
  for (const loc of locations) {
    byUser[loc.userId.toString()] = loc;
  }

  return members.map((m) => {
    const loc = byUser[m.userId._id.toString()];
    return {
      userId: m.userId._id,
      name: m.userId.name,
      avatarUrl: m.userId.avatarUrl,
      role: m.role,
      lastSeenAt: m.lastSeenAt,
      location: loc ? loc.location : null,
      accuracyMeters: loc ? loc.accuracyMeters : null,
      speedMps: loc ? loc.speedMps : null,
      headingDegrees: loc ? loc.headingDegrees : null,
      recordedAt: loc ? loc.recordedAt : null,
      updatedAt: loc ? loc.updatedAt : null,
    };
  });
};

export const getHistorySummary = async (tripId, userId) => {
  const membership = await TripMember.findOne({ tripId, userId }).lean();
  if (!membership) throw new AppError('Not a member of this trip', 403);

  const trip = await Trip.findById(tripId).lean();
  if (!trip) throw new AppError('Trip not found', 404);

  const members = await TripMember.find({ tripId, status: 'joined' })
    .populate('userId', 'name avatarUrl')
    .lean();

  const messages = await Message.find({ tripId }).sort({ createdAt: -1 }).limit(50).lean();
  const checkpoints = await Checkpoint.find({ tripId }).sort({ sequence: 1 }).lean();
  const emergencies = await EmergencyEvent.find({ tripId }).sort({ createdAt: -1 }).lean();

  return {
    trip,
    members,
    messageCount: messages.length,
    checkpoints,
    emergencies,
  };
};
