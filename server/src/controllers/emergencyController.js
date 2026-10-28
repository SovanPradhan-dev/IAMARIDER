import {
  createEmergency, getEmergencies, resolveEmergency,
} from '../services/emergencyService.js';

export const createEmergencyHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const event = await createEmergency({
    tripId,
    reportedBy: req.user.userId,
    ...req.validatedBody,
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
