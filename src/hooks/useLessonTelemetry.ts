import { useCallback, useEffect, useRef, useState } from 'react';
import { platformService } from '../services/platformService';
import type { TelemetryPoint } from '../types';

const SYNC_INTERVAL_MS = 15_000; // batch points to the DB every 15s

interface TelemetryState {
  recording: boolean;
  pointCount: number;
  error: string | null;
}

// PWA/mobile-friendly geolocation logger. Streams watchPosition fixes into a
// local buffer and syncs them to lesson_telemetry in batches, then finalises
// with computed distance / max speed on stop.
export function useLessonTelemetry(bookingId: string) {
  const [state, setState] = useState<TelemetryState>({ recording: false, pointCount: 0, error: null });
  const watchIdRef = useRef<number | null>(null);
  const telemetryIdRef = useRef<string | null>(null);
  const pointsRef = useRef<TelemetryPoint[]>([]);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported on this device' }));
      return;
    }
    try {
      const telemetryId = await platformService.startTelemetry(bookingId);
      telemetryIdRef.current = telemetryId;
      pointsRef.current = [];

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          pointsRef.current.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            t: new Date(pos.timestamp).toISOString(),
            speed: pos.coords.speed,
          });
          setState((s) => ({ ...s, pointCount: pointsRef.current.length }));
        },
        (err) => setState((s) => ({ ...s, error: err.message })),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
      );

      syncTimerRef.current = setInterval(() => {
        if (telemetryIdRef.current && pointsRef.current.length > 0) {
          platformService
            .appendTelemetryPoints(telemetryIdRef.current, pointsRef.current)
            .catch((err) => console.warn('Telemetry sync failed', err));
        }
      }, SYNC_INTERVAL_MS);

      setState({ recording: true, pointCount: 0, error: null });
    } catch (err: any) {
      setState((s) => ({ ...s, error: err.message ?? 'Failed to start tracking' }));
    }
  }, [bookingId]);

  const stop = useCallback(async () => {
    stopWatch();
    const telemetryId = telemetryIdRef.current;
    if (telemetryId) {
      try {
        await platformService.finishTelemetry(telemetryId, pointsRef.current);
      } catch (err: any) {
        setState((s) => ({ ...s, error: err.message ?? 'Failed to save route log' }));
      }
      telemetryIdRef.current = null;
    }
    setState((s) => ({ ...s, recording: false }));
  }, [stopWatch]);

  useEffect(() => stopWatch, [stopWatch]); // cleanup on unmount

  return { ...state, start, stop };
}
