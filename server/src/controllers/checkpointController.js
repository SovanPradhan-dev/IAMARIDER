import {
  createCheckpoint, getCheckpoints, updateCheckpoint,
  deleteCheckpoint, reportArrival, getArrivals,
} from '../services/checkpointService.js';

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
  const arrival = await reportArrival({ tripId, checkpointId, userId: req.user.userId });
  res.status(201).json({ arrival });
};

export const getArrivalsHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const arrivals = await getArrivals({ tripId, userId: req.user.userId });
  res.json({ arrivals });
};
