import mongoose from 'mongoose';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { LiveLocation } from '../models/LiveLocation.js';
import { LocationHistory } from '../models/LocationHistory.js';
import { CheckpointArrival } from '../models/CheckpointArrival.js';
import { Message } from '../models/Message.js';
import { EmergencyEvent } from '../models/EmergencyEvent.js';
import { Checkpoint } from '../models/Checkpoint.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';
import { withTransaction } from '../utils/transaction.js';
import { randomInt } from 'node:crypto';

const generateTripCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomInt(chars.length));
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

  let createdTrip;
  await withTransaction(mongoose.connection, async (session) => {
    const [trip] = await Trip.create([{
      ...data,
      tripCode,
      memberCount: 1,
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
    }], session ? { session } : undefined);

    await TripMember.create([{
      tripId: trip._id,
      userId: creatorId,
      role: 'leader',
      status: 'joined',
    }], session ? { session } : undefined);

    createdTrip = trip;
  });

  logger.info('trip created', { tripId: createdTrip._id, tripCode, creatorId });
  return await Trip.findById(createdTrip._id);
};

/**
 * Get trips created by, led by, or joined by the user.
 */
export const listUserTrips = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [trips, total] = await Promise.all([
    Trip.find({
      $or: [
        { createdBy: userId },
        { leaderId: userId },
        { _id: { $in: await membershipTripIds(userId) } },
      ],
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Trip.countDocuments({
      $or: [
        { createdBy: userId },
        { leaderId: userId },
        { _id: { $in: await membershipTripIds(userId) } },
      ],
    }),
  ]);
  return { trips, total, page, limit };
};

/**
 * Get trip IDs where the user has an active 'joined' membership.
 */const membershipTripIds = async (userId) => {
  const docs = await TripMember.find({ userId, status: 'joined' }).distinct('tripId');
  return docs.map((d) => d.toString());
};

/**
 * Get a single trip by its MongoDB _id, with member info.
 */
export const getTripById = async (tripId, userId) => {
  const trip = await Trip.findById(tripId).lean();
  if (!trip) throw new AppError('Trip not found', 404);

  const membership = await TripMember.findOne({ tripId, userId }).lean();
  if (!membership || membership.status !== 'joined') {
    // Only allow viewing if trip is public
    if (trip.privacy !== 'public') throw new AppError('Not a member of this trip', 403);
  }

  return { trip, isMember: membership?.status === 'joined', membership };
};

/**
 * Join a trip by tripCode. Concurrency-safe against member limits.
 */
export const joinTrip = async (tripCode, userId) => {
  let trip = await Trip.findOne({ tripCode });
  if (!trip) throw new AppError('Invalid trip code', 404);
  if (!['scheduled', 'active'].includes(trip.status)) {
    throw new AppError('This trip is no longer accepting members', 400);
  }

  const existing = await TripMember.findOne({ tripId: trip._id, userId });
  if (existing?.status === 'joined') {
    throw new AppError('You are already a member of this trip', 409);
  }

  if (trip.memberCount == null) {
    const activeMemberCount = await TripMember.countDocuments({ tripId: trip._id, status: 'joined' });
    await Trip.updateOne(
      { _id: trip._id, memberCount: { $exists: false } },
      { $set: { memberCount: activeMemberCount } }
    );
    trip = await Trip.findById(trip._id);
  }

  const reservation = await Trip.findOneAndUpdate(
    {
      _id: trip._id,
      status: { $in: ['scheduled', 'active'] },
      memberCount: { $lt: trip.maxMembers },
    },
    { $inc: { memberCount: 1 } },
    { new: true }
  );
  if (!reservation) {
    const currentTrip = await Trip.findById(trip._id).select('status memberCount maxMembers').lean();
    if (!currentTrip) throw new AppError('Trip not found', 404);
    if (!['scheduled', 'active'].includes(currentTrip.status)) {
      throw new AppError('This trip is no longer accepting members', 400);
    }
    throw new AppError('Trip has reached its member limit', 403);
  }

  try {
    if (existing) {
      const rejoined = await TripMember.findOneAndUpdate(
        { _id: existing._id, status: { $in: ['left', 'removed'] } },
        { $set: { status: 'joined', joinedAt: new Date(), role: 'rider' } },
        { new: true }
      );
      if (!rejoined) throw new AppError('You are already a member of this trip', 409);
    } else {
      await TripMember.create({ tripId: trip._id, userId, role: 'rider', status: 'joined' });
    }
  } catch (err) {
    await Trip.updateOne(
      { _id: trip._id, memberCount: { $gt: 1 } },
      { $inc: { memberCount: -1 } }
    );
    if (err.code === 11000) throw new AppError('You are already a member of this trip', 409);
    throw err;
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

  const membership = await TripMember.findOneAndUpdate(
    { tripId, userId, status: 'joined' },
    { $set: { status: 'left', lastSeenAt: new Date() } },
    { new: true }
  );
  if (!membership) throw new AppError('You are not a member of this trip', 400);

  // Stop location sharing
  await LiveLocation.deleteOne({ tripId, userId });
  await Trip.updateOne({ _id: tripId, memberCount: { $gt: 1 } }, { $inc: { memberCount: -1 } });

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

  const membership = await TripMember.findOneAndUpdate(
    { tripId, userId: targetUserId, status: 'joined' },
    { $set: { status: 'removed', lastSeenAt: new Date() } },
    { new: true }
  );
  if (!membership) throw new AppError('User is not a member of this trip', 400);

  await LiveLocation.deleteOne({ tripId, userId: targetUserId });
  await Trip.updateOne({ _id: tripId, memberCount: { $gt: 1 } }, { $inc: { memberCount: -1 } });

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
  if (updates.maxMembers !== undefined) {
    const currentMemberCount = await TripMember.countDocuments({ tripId, status: 'joined' });
    if (updates.maxMembers < currentMemberCount) {
      throw new AppError('Member limit cannot be lower than the current number of riders', 400);
    }
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

  await withTransaction(mongoose.connection, async (session) => {
    // Demote current leader to rider
    await TripMember.findOneAndUpdate(
      { tripId, userId: actorId },
      { $set: { role: 'rider' } },
      session ? { session } : undefined
    );
    // Promote target to leader
    targetMembership.role = 'leader';
    await targetMembership.save(session ? { session } : undefined);

    trip.leaderId = targetUserId;
    await trip.save(session ? { session } : undefined);
  });

  logger.info('leadership transferred', { tripId, actorId, targetUserId });
  return trip;
};

export const listMembers = async (tripId, userId) => {
  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
  if (!membership) throw new AppError('You are not a member of this trip', 403);

  const members = await TripMember.find({ tripId, status: 'joined' })
    .populate('userId', 'name avatarUrl')
    .sort({ role: -1, joinedAt: 1 })
    .lean();
  return members;
};

/**
 * Get latest live locations for all joined members of a trip.
 */
export const getLatestLocations = async (tripId, userId) => {
  const members = await TripMember.find({ tripId, status: 'joined' })
    .populate('userId', 'name avatarUrl')
    .lean();
  if (!members.some((member) => member.userId?._id.toString() === userId.toString())) {
    throw new AppError('You are not a member of this trip', 403);
  }

  const memberIds = members.map((member) => member.userId._id);
  const locations = await LiveLocation.find({ tripId, userId: { $in: memberIds } }).lean();

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
      freshness: loc ? (Date.now() - new Date(loc.updatedAt).getTime() <= 90_000 ? 'online' : 'stale') : 'offline',
    };
  });
};

export const getLocationHistory = async (tripId, userId, { page = 1, limit = 100 }) => {
  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
  if (!membership) throw new AppError('You are not a member of this trip', 403);

  const skip = (page - 1) * limit;
  const [history, total] = await Promise.all([
    LocationHistory.find({ tripId })
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatarUrl')
      .lean(),
    LocationHistory.countDocuments({ tripId }),
  ]);
  return { history: history.reverse(), total, page, limit };
};

export const getHistorySummary = async (tripId, userId) => {
  const membership = await TripMember.findOne({ tripId, userId }).lean();
  if (!membership) throw new AppError('Not a member of this trip', 403);

  const trip = await Trip.findById(tripId).lean();
  if (!trip) throw new AppError('Trip not found', 404);

  const [members, messageCount, checkpoints, emergencies, arrivals] = await Promise.all([
    TripMember.find({ tripId })
      .populate('userId', 'name avatarUrl')
      .sort({ joinedAt: 1 })
      .lean(),
    Message.countDocuments({ tripId }),
    Checkpoint.find({ tripId }).sort({ sequence: 1 }).lean(),
    EmergencyEvent.find({ tripId }).sort({ createdAt: -1 }).lean(),
    CheckpointArrival.find({ tripId })
      .populate('userId', 'name avatarUrl')
      .sort({ arrivedAt: -1 })
      .lean(),
  ]);

  return {
    trip,
    members,
    messageCount,
    checkpoints,
    emergencies,
    arrivals,
  };
};
