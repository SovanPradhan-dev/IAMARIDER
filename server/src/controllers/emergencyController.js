import {
  createEmergency, getEmergencies, resolveEmergency,
} from '../services/emergencyService.js';
import { EmergencyEvent } from '../models/EmergencyEvent.js';
import { emitTripEvent, notifyTripMembers } from '../utils/tripEvents.js';

export const createEmergencyHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const created = await createEmergency({
    tripId,
    reportedBy: req.user.userId,
    ...req.validatedBody,
  });
  const event = await EmergencyEvent.findById(created._id).populate('reportedBy', 'name avatarUrl').lean();
  emitTripEvent(req, tripId, 'emergency:new', event);
  await notifyTripMembers(req.app.get('io'), tripId, {
    type: 'emergency_alert',
    title: 'Safety alert reported',
    message: `${event.reportedBy?.name || 'A rider'} reported an emergency.`,
    excludeUserIds: [req.user.userId],
  });
  res.status(201).json({ emergency: event });
};

export const getEmergenciesHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const emergencies = await getEmergencies({ tripId, userId: req.user.userId });
  res.json({ emergencies });
};

export const resolveEmergencyHandler = async (req, res) => {
  const { tripId, eventId } = req.validatedParams;
  const event = await resolveEmergency({
    tripId,
    eventId,
    actorId: req.user.userId,
    updates: req.validatedBody,
  });
  res.json({ emergency: event });
};
