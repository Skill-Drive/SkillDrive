import { describe, expect, it } from 'vitest';
import { haversineKm, maxSpeedKmh, routeDistanceKm } from '../geo';
import type { TelemetryPoint } from '../../types';

const pt = (lat: number, lng: number, speed: number | null = null): TelemetryPoint => ({
  lat,
  lng,
  t: new Date().toISOString(),
  speed,
});

describe('telemetry geometry', () => {
  it('haversine matches a known distance (Sydney CBD → Parramatta ~20km)', () => {
    const d = haversineKm(-33.8688, 151.2093, -33.815, 151.0011);
    expect(d).toBeGreaterThan(18);
    expect(d).toBeLessThan(22);
  });

  it('sums route distance across an ordered trail', () => {
    const points = [pt(-33.8688, 151.2093), pt(-33.86, 151.2), pt(-33.85, 151.19)];
    const total = routeDistanceKm(points);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeCloseTo(
      haversineKm(-33.8688, 151.2093, -33.86, 151.2) + haversineKm(-33.86, 151.2, -33.85, 151.19),
      1,
    );
  });

  it('returns 0 for fewer than two points', () => {
    expect(routeDistanceKm([])).toBe(0);
    expect(routeDistanceKm([pt(0, 0)])).toBe(0);
  });

  it('converts max speed from m/s to km/h and ignores nulls', () => {
    expect(maxSpeedKmh([pt(0, 0, 10), pt(0, 0, null), pt(0, 0, 15)])).toBe(54);
    expect(maxSpeedKmh([pt(0, 0, null)])).toBe(0);
  });
});
