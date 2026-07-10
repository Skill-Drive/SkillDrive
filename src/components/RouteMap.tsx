import { useMemo } from 'react';
import type { LessonTelemetry } from '../types';

interface RouteMapProps {
  telemetry: LessonTelemetry;
  height?: number;
}

// Dependency-free "flight log" route viewer: projects the GPS trail onto an
// SVG canvas. An "Open in Google Maps" link gives a full-map view without
// requiring a Mapbox/Google API key to be configured.
export const RouteMap = ({ telemetry, height = 280 }: RouteMapProps) => {
  const points = telemetry.points ?? [];

  const { path, start, end } = useMemo(() => {
    if (points.length < 2) return { path: '', start: null, end: null };
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = 8;
    const w = 100 - pad * 2, h = 100 - pad * 2;
    const latSpan = Math.max(maxLat - minLat, 1e-5);
    const lngSpan = Math.max(maxLng - minLng, 1e-5);
    const project = (lat: number, lng: number) => ({
      x: pad + ((lng - minLng) / lngSpan) * w,
      y: pad + ((maxLat - lat) / latSpan) * h, // north is up
    });
    const coords = points.map((p) => project(p.lat, p.lng));
    const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
    return { path: d, start: coords[0], end: coords[coords.length - 1] };
  }, [points]);

  if (points.length < 2) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
        Not enough GPS points were recorded to draw a route.
      </div>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const gmapsUrl = `https://www.google.com/maps/dir/${first.lat},${first.lng}/${last.lat},${last.lng}`;

  return (
    <div>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height, background: 'var(--paper-2)', borderRadius: 12, border: '1px solid var(--line)' }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="rm-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(11,16,32,0.06)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#rm-grid)" />
        <path d={path} fill="none" stroke="var(--cobalt, #1b3cff)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        {start && <circle cx={start.x} cy={start.y} r="2.4" fill="#2e9e44" stroke="#fff" strokeWidth="0.8" />}
        {end && <circle cx={end.x} cy={end.y} r="2.4" fill="#d64545" stroke="#fff" strokeWidth="0.8" />}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12 }}>
        <div style={{ display: 'flex', gap: 14, color: 'var(--ink-mute)' }}>
          <span>● <span style={{ color: '#2e9e44' }}>Start</span> / <span style={{ color: '#d64545' }}>End</span></span>
          {telemetry.distance_km != null && <span>{telemetry.distance_km} km</span>}
          {telemetry.max_speed_kmh != null && <span>max {telemetry.max_speed_kmh} km/h</span>}
          <span>{points.length} GPS points</span>
        </div>
        <a href={gmapsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--cobalt, #1b3cff)', fontWeight: 600 }}>
          Open in Google Maps →
        </a>
      </div>
    </div>
  );
};
