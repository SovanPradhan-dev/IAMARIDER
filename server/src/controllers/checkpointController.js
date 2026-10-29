import {
  createCheckpoint, getCheckpoints, updateCheckpoint,
  deleteCheckpoint, reportArrival, getArrivals,
} from '../services/checkpointService.js';
import { CheckpointArrival } from '../models/CheckpointArrival.js';
import { emitTripEvent, notifyTripMembers } from '../utils/tripEvents.js';

export const createCheckpointHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const checkpoint = await createCheckpoint({
    tripId,
    createdBy: req.user.userId,
    ...req.validatedBody,
  });
  res.status(201).json({ checkpoint });
};

export const getCheckpointsHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const checkpoints = await getCheckpoints({ tripId, userId: req.user.userId });
  res.json({ checkpoints });
};

export const updateCheckpointHandler = async (req, res) => {
  const { tripId, checkpointId } = req.validatedParams;
  const checkpoint = await updateCheckpoint({
    tripId,
    checkpointId,
    actorId: req.user.userId,
    updates: req.validatedBody,
  });
  res.json({ checkpoint });
};

export const deleteCheckpointHandler = async (req, res) => {
  const { tripId, checkpointId } = req.validatedParams;
  await deleteCheckpoint({ tripId, checkpointId, actorId: req.user.userId });
  res.json({ message: 'Checkpoint deleted' });
};

export const reportArrivalHandler = async (req, res) => {
  const { tripId, checkpointId } = req.validatedParams;
  const created = await reportArrival({ tripId, checkpointId, userId: req.user.userId });
  const arrival = await CheckpointArrival.findById(created._id).populate('userId', 'name avatarUrl').lean();
  emitTripEvent(req, tripId, 'checkpoint:arrival:new', arrival);
  await notifyTripMembers(req.app.get('io'), tripId, {
    type: 'checkpoint_arrival',
    title: 'Rider reached a checkpoint',
    message: `${arrival.userId?.name || 'A rider'} reached a checkpoint.`,
    excludeUserIds: [req.user.userId],
  });
  res.status(201).json({ arrival });
};

export const getArrivalsHandler = async (req, res) => {
  const { tripId, checkpointId } = req.validatedParams;
  const arrivals = await getArrivals({ tripId, checkpointId, userId: req.user.userId });
  res.json({ arrivals });
};
