import { Checkpoint } from '../models/Checkpoint.js';
import { CheckpointArrival } from '../models/CheckpointArrival.js';
import { TripMember } from '../models/TripMember.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export const createCheckpoint = async ({ tripId, createdBy, ...data }) => {
  const membership = await TripMember.findOne({ tripId, userId: createdBy, status: 'joined' });
  if (!membership || membership.role !== 'leader') {
    throw new AppError('Only the trip leader can create checkpoints', 403);
  }

  const checkpoint = await Checkpoint.create({
    tripId,
    createdBy,
    ...data,
    location: {
      type: 'Point',
      coordinates: [data.longitude, data.latitude],
    },
  });

  logger.info('checkpoint created', { tripId, checkpointId: checkpoint._id, createdBy });
  return checkpoint;
};

export const getCheckpoints = async ({ tripId, userId }) => {
  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }

  return Checkpoint.find({ tripId }).sort({ sequence: 1, createdAt: 1 }).lean();
};

export const updateCheckpoint = async ({ tripId, checkpointId, actorId, updates }) => {
  const checkpoint = await Checkpoint.findById(checkpointId);
  if (!checkpoint) throw new AppError('Checkpoint not found', 404);
  if (checkpoint.tripId.toString() !== tripId) throw new AppError('Checkpoint not found in this trip', 404);

  const membership = await TripMember.findOne({ tripId, userId: actorId, status: 'joined' }).lean();
  if (!membership || membership.role !== 'leader') {
    throw new AppError('Only the trip leader can edit checkpoints', 403);
  }

  const allowed = ['name', 'description', 'sequence', 'plannedArrivalAt'];
  const set = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) set[key] = updates[key];
  }
  if (updates.latitude !== undefined && updates.longitude !== undefined) {
    set.location = {
      type: 'Point',
      coordinates: [updates.longitude, updates.latitude],
    };
  }

  const updated = await Checkpoint.findByIdAndUpdate(checkpointId, { $set: set }, { new: true });
  logger.info('checkpoint updated', { checkpointId, actorId });
  return updated;
};

export const deleteCheckpoint = async ({ tripId, checkpointId, actorId }) => {
  const checkpoint = await Checkpoint.findById(checkpointId);
  if (!checkpoint) throw new AppError('Checkpoint not found', 404);
  if (checkpoint.tripId.toString() !== tripId) throw new AppError('Checkpoint not found in this trip', 404);

  const membership = await TripMember.findOne({ tripId, userId: actorId, status: 'joined' }).lean();
  if (!membership || membership.role !== 'leader') {
    throw new AppError('Only the trip leader can delete checkpoints', 403);
  }

  await Checkpoint.findByIdAndDelete(checkpointId);
  await CheckpointArrival.deleteMany({ checkpointId });
  logger.info('checkpoint deleted', { checkpointId, actorId });
};

export const reportArrival = async ({ tripId, checkpointId, userId }) => {
  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }

  const checkpoint = await Checkpoint.findById(checkpointId);
  if (!checkpoint) throw new AppError('Checkpoint not found', 404);
  if (checkpoint.tripId.toString() !== tripId) throw new AppError('Checkpoint not found in this trip', 404);

  const existing = await CheckpointArrival.findOne({ checkpointId, userId });
  if (existing) {
    throw new AppError('Arrival already reported for this checkpoint', 409);
  }

  const arrival = await CheckpointArrival.create({ checkpointId, tripId, userId });
  logger.info('arrival reported', { tripId, checkpointId, userId });
  return arrival;
};

export const getArrivals = async ({ tripId, userId }) => {
  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }

  return CheckpointArrival.find({ tripId })
    .populate('userId', 'name avatarUrl')
    .sort({ arrivedAt: -1 })
    .lean();
};
