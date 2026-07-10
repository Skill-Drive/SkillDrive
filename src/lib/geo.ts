import type { TelemetryPoint } from '../types';

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Total route distance over an ordered point trail, in km. */
export function routeDistanceKm(points: TelemetryPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return Math.round(total * 100) / 100;
}

/** Max recorded speed converted from m/s (Geolocation API) to km/h. */
export function maxSpeedKmh(points: TelemetryPoint[]): number {
  const max = points.reduce((m, p) => Math.max(m, p.speed ?? 0), 0);
  return Math.round(max * 3.6 * 100) / 100;
}
