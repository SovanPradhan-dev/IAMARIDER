import { upsertLiveLocation, stopSharing } from '../services/locationService.js';
import { TripMember } from '../models/TripMember.js';
import { Trip } from '../models/Trip.js';
import { AppError } from '../middleware/errorHandler.js';

export const updateLocationHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const payload = req.validatedBody;

  const membership = await TripMember.findOne({ tripId, userId: req.user.userId, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }
  const trip = await Trip.findById(tripId).select('status').lean();
  if (!trip || trip.status !== 'active') {
    throw new AppError('Location updates are only accepted during an active trip', 400);
  }

  const liveLocation = await upsertLiveLocation({
    tripId,
    userId: req.user.userId,
    payload,
  });

  res.json({ location: liveLocation });
};

export const stopSharingHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const membership = await TripMember.findOne({ tripId, userId: req.user.userId, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }
  await stopSharing(tripId, req.user.userId);
  res.json({ message: 'Location sharing stopped' });
};
