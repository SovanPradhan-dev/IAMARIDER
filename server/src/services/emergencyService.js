import { EmergencyEvent } from '../models/EmergencyEvent.js';
import { TripMember } from '../models/TripMember.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export const createEmergency = async ({ tripId, reportedBy, ...data }) => {
  const membership = await TripMember.findOne({ tripId, userId: reportedBy, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }

  const event = await EmergencyEvent.create({
    tripId,
    reportedBy,
    ...data,
    location: data.latitude != null && data.longitude != null
      ? { type: 'Point', coordinates: [data.longitude, data.latitude] }
      : undefined,
  });

  logger.warn('emergency reported', { tripId, eventId: event._id, reportedBy, eventType: data.eventType });
  return event;
};

export const getEmergencies = async ({ tripId, userId }) => {
  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }

  return EmergencyEvent.find({ tripId })
    .populate('reportedBy', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .lean();
};

export const resolveEmergency = async ({ tripId, eventId, actorId, updates }) => {
  const event = await EmergencyEvent.findById(eventId);
  if (!event) throw new AppError('Emergency event not found', 404);
  if (event.tripId.toString() !== tripId) throw new AppError('Event not found in this trip', 404);

  const membership = await TripMember.findOne({ tripId, userId: actorId, status: 'joined' }).lean();
  if (!membership || membership.role !== 'leader') {
    throw new AppError('Only the trip leader can resolve emergencies', 403);
  }
  if (event.status !== 'active') {
    throw new AppError('Emergency event is already closed', 409);
  }

  event.status = updates.status;
  if (updates.status === 'resolved') event.resolvedAt = new Date();
  if (updates.resolutionNotes !== undefined) event.resolutionNotes = updates.resolutionNotes;
  await event.save();

  logger.info('emergency resolved', { tripId, eventId, actorId, status: updates.status });
  return event;
};
