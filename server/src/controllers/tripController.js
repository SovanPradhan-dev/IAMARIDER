import {
  createTrip, listUserTrips, getTripById, joinTrip, leaveTrip,
  removeMember, updateTrip, startTrip, endTrip, cancelTrip,
  transferLeadership, listMembers, getLatestLocations, getLocationHistory, getHistorySummary,
} from '../services/tripService.js';
import {
  emitTripEvent,
  notifyTripMembers,
  notifyTripUser,
  removeUserFromTripRoom,
} from '../utils/tripEvents.js';

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
  await notifyTripMembers(req.app.get('io'), trip._id, {
    type: 'new_participant',
    title: 'A rider joined',
    message: 'A new rider joined your trip.',
    excludeUserIds: [req.user.userId],
  });
  res.json({ trip });
};

export const leaveTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  await leaveTrip(tripId, req.user.userId);
  const io = req.app.get('io');
  emitTripEvent(req, tripId, 'trip:member:left', { tripId, userId: req.user.userId });
  await removeUserFromTripRoom(io, tripId, req.user.userId);
  await notifyTripMembers(io, tripId, {
    type: 'participant_left',
    title: 'A rider left',
    message: 'A rider left the trip.',
    excludeUserIds: [req.user.userId],
  });
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
  const io = req.app.get('io');
  await removeUserFromTripRoom(io, tripId, userId);
  emitTripEvent(req, tripId, 'trip:member:left', { tripId, userId });
  await notifyTripMembers(io, tripId, {
    type: 'participant_left',
    title: 'A rider was removed',
    message: 'A trip leader removed a rider.',
    excludeUserIds: [req.user.userId, userId],
  });
  await notifyTripUser(io, userId, tripId, {
    type: 'participant_left',
    title: 'You were removed from a trip',
    message: 'A trip leader removed you from the trip.',
  });
  res.json({ message: 'Member removed' });
};

export const startTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const trip = await startTrip(tripId, req.user.userId);
  emitTripEvent(req, tripId, 'trip:started', { tripId, trip });
  await notifyTripMembers(req.app.get('io'), tripId, {
    type: 'trip_started',
    title: 'Trip started',
    message: 'Your trip is now active.',
    excludeUserIds: [req.user.userId],
  });
  res.json({ trip });
};

export const endTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const trip = await endTrip(tripId, req.user.userId);
  emitTripEvent(req, tripId, 'trip:ended', { tripId, trip });
  await notifyTripMembers(req.app.get('io'), tripId, {
    type: 'trip_completed',
    title: 'Trip completed',
    message: 'Your trip has been marked complete.',
    excludeUserIds: [req.user.userId],
  });
  res.json({ trip });
};

export const cancelTripHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const trip = await cancelTrip(tripId, req.user.userId);
  emitTripEvent(req, tripId, 'trip:ended', { tripId, trip });
  await notifyTripMembers(req.app.get('io'), tripId, {
    type: 'trip_cancelled',
    title: 'Trip cancelled',
    message: 'Your trip was cancelled by its leader.',
    excludeUserIds: [req.user.userId],
  });
  res.json({ trip });
};

export const transferLeadershipHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const { targetUserId } = req.validatedBody;
  const trip = await transferLeadership(tripId, req.user.userId, targetUserId);
  await notifyTripMembers(req.app.get('io'), tripId, {
    type: 'leadership_changed',
    title: 'Trip leader changed',
    message: 'Leadership of your trip has been transferred.',
    excludeUserIds: [req.user.userId],
  });
  res.json({ trip });
};

export const listMembersHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const members = await listMembers(tripId, req.user.userId);
  res.json({ members });
};

export const getLocationsHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const locations = await getLatestLocations(tripId, req.user.userId);
  res.json({ locations });
};

export const getLocationHistoryHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const { page = 1, limit = 100 } = req.validatedQuery || {};
  const result = await getLocationHistory(tripId, req.user.userId, { page, limit });
  res.json(result);
};

export const getHistorySummaryHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const summary = await getHistorySummary(tripId, req.user.userId);
  res.json(summary);
};
