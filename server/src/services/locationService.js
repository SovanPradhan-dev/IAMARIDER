import { LiveLocation } from '../models/LiveLocation.js';
import { LocationHistory } from '../models/LocationHistory.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

/**
 * GPS data quality / freshness configuration.
 */
export const LOCATION_CONFIG = {
  // Maximum age of a device-reported timestamp before it is considered stale (ms)
  MAX_RECORDED_AGE_MS: 5 * 60 * 1000, // 5 minutes
  // A location is considered "stale" if no update within this window (ms)
  STALE_THRESHOLD_MS: 90 * 1000, // 90 seconds
  // Minimum interval between accepted updates from the same user (ms)
  MIN_UPDATE_INTERVAL_MS: 1000,
  // Max plausible speed (m/s) ~ 180 km/h, used to detect implausible jumps
  MAX_SPEED_MPS: 120,
  // History sampling: only store every Nth update (kept loose; caller decides)
  HISTORY_SAMPLE_EVERY: 5,
};

/**
 * Validate and persist a single live location update.
 * Returns the saved LiveLocation document.
 */
export const upsertLiveLocation = async ({ tripId, userId, payload }) => {
  const { latitude, longitude, accuracyMeters, speedMps, headingDegrees, recordedAt } = payload;

  // Reject implausible speeds if provided (treat device speed as untrusted)
  if (speedMps != null && speedMps > LOCATION_CONFIG.MAX_SPEED_MPS) {
    throw new AppError('Implausible speed value', 400);
  }

  const recordedDate = recordedAt ? new Date(recordedAt) : new Date();
  const now = new Date();

  // Reject excessively stale device timestamps
  const ageMs = now - recordedDate;
  if (ageMs > LOCATION_CONFIG.MAX_RECORDED_AGE_MS) {
    throw new AppError('Location timestamp is too stale', 400);
  }

  // Reject future timestamps beyond a small tolerance
  if (recordedDate > new Date(now.getTime() + 60 * 1000)) {
    throw new AppError('Location timestamp is in the future', 400);
  }

  const location = {
    type: 'Point',
    coordinates: [longitude, latitude], // GeoJSON order: [lon, lat]
  };

  const updatedAt = new Date();

  const liveLocation = await LiveLocation.findOneAndUpdate(
    { tripId, userId },
    {
      $set: {
        location,
        accuracyMeters: accuracyMeters ?? null,
        speedMps: speedMps ?? null,
        headingDegrees: headingDegrees ?? null,
        recordedAt: recordedDate,
        updatedAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Sampled permanent history (not every reading)
  if (Math.random() * LOCATION_CONFIG.HISTORY_SAMPLE_EVERY < 1) {
    await LocationHistory.create({
      tripId,
      userId,
      location,
      recordedAt: recordedDate,
      accuracyMeters: accuracyMeters ?? null,
    });
  }

  logger.debug('location updated', { tripId, userId, recordedAt: recordedDate });
  return liveLocation;
};

/**
 * Mark a user's location as no longer being published (stop sharing).
 */
export const stopSharing = async (tripId, userId) => {
  await LiveLocation.deleteOne({ tripId, userId });
  logger.info('location sharing stopped', { tripId, userId });
};

/**
 * Get freshness status for a location relative to the stale threshold.
 */
export const freshnessStatus = (updatedAt) => {
  if (!updatedAt) return 'offline';
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (ageMs > LOCATION_CONFIG.STALE_THRESHOLD_MS) return 'stale';
  return 'online';
};
