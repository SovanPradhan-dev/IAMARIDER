import {
  createTrip, listUserTrips, getTripById, joinTrip, leaveTrip,
  removeMember, updateTrip, startTrip, endTrip, cancelTrip,
  transferLeadership, listMembers, getLatestLocations, getHistorySummary,
} from '../services/tripService.js';
import { logger } from '../config/logger.js';

export const createTripHandler = async (req, res) => {
  const trip = await createTrip({ creatorId: req.user.userId, ...req.validatedBody });
  res.status(201).json({ trip });
};

export const listTripsHandler = async (req, res) => {
  const { page = 1, limit = 20 } = req.validatedQuery || {};
  const result = await listUserTrips(req.user.userId, { page, limit });
  res.json(result);
};

export const getTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const result = await getTripById(tripId, req.user.userId);
  res.json(result);
};

export const joinTripHandler = async (req, res) => {
  const { tripCode } = req.validatedBody;
  const trip = await joinTrip(tripCode, req.user.userId);
  res.json({ trip });
};

export const leaveTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  await leaveTrip(tripId, req.user.userId);
  res.json({ message: 'Left the trip' });
};

export const updateTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const trip = await updateTrip(tripId, req.user.userId, req.validatedBody);
  res.json({ trip });
};

export const removeMemberHandler = async (req, res) => {
  const { tripId, userId } = req.validatedParams;
  await removeMember(tripId, userId, req.user.userId);
  res.json({ message: 'Member removed' });
};

export const startTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const trip = await startTrip(tripId, req.user.userId);
  res.json({ trip });
};

export const endTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const trip = await endTrip(tripId, req.user.userId);
  res.json({ trip });
};

export const cancelTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const trip = await cancelTrip(tripId, req.user.userId);
  res.json({ trip });
};

export const transferLeadershipHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const { targetUserId } = req.validatedBody;
  const trip = await transferLeadership(tripId, req.user.userId, targetUserId);
  res.json({ trip });
};

export const listMembersHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const members = await listMembers(tripId);
  res.json({ members });
};

export const getLocationsHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const locations = await getLatestLocations(tripId);
  res.json({ locations });
};

export const getHistorySummaryHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const summary = await getHistorySummary(tripId, req.user.userId);
  res.json(summary);
};
