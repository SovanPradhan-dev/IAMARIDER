import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for controlled, throttled GPS sharing.
 * Reads the browser Geolocation API with permission handling and emits
 * validated location updates through a provided send callback.
 */
export const useGeolocation = ({ sendLocation, enabled = false, intervalMs = 4000 } = {}) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null); // 'granted' | 'denied' | 'prompt' | 'unknown'
  const watchId = useRef(null);
  const intervalRef = useRef(null);
  const lastSent = useRef(0);

  const isValid = (coords) =>
    coords &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180;

  const handlePosition = useCallback(
    (pos) => {
      const { coords, timestamp } = pos;
      if (!isValid(coords)) return;
      setPosition({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracy,
        speedMps: coords.speed ?? null,
        headingDegrees: coords.heading ?? null,
        recordedAt: new Date(timestamp).toISOString(),
      });
      setError(null);
      setPermission('granted');

      const now = Date.now();
      if (sendLocation && now - lastSent.current >= intervalMs) {
        lastSent.current = now;
        sendLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
          ...(Number.isFinite(coords.speed) ? { speedMps: coords.speed } : {}),
          ...(Number.isFinite(coords.heading) ? { headingDegrees: coords.heading } : {}),
          recordedAt: new Date(timestamp).toISOString(),
        });
      }
    },
    [sendLocation, intervalMs]
  );

  const handleError = useCallback((err) => {
    setError(err.message);
    if (err.code === err.PERMISSION_DENIED) setPermission('denied');
  }, []);

  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setPermission('unsupported');
      return false;
    }
    setPermission('prompt');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePosition(pos);
          resolve(true);
        },
        (err) => {
          handleError(err);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, [handlePosition, handleError]);

  const start = useCallback(() => {
    if (!navigator.geolocation) return;
    setPermission('granted');
    watchId.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  }, [handlePosition, handleError]);

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  // Poll-based fallback for browsers where watchPosition is unreliable
  useEffect(() => {
    if (!enabled) return;
    intervalRef.current = setInterval(() => {
      if (watchId.current === null) {
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      }
    }, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [enabled, intervalMs, handlePosition, handleError]);

  useEffect(() => {
    if (enabled) start();
    return () => stop();
  }, [enabled, start, stop]);

  return {
    position,
    error,
    permission,
    isSupported: !!navigator.geolocation,
    requestPermission,
    start,
    stop,
  };
};
