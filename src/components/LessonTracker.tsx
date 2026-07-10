import { useEffect, useState } from 'react';
import { MapPin, Play, Square } from 'lucide-react';
import { useLessonTelemetry } from '../hooks/useLessonTelemetry';
import { platformService } from '../services/platformService';
import { RouteMap } from './RouteMap';
import type { Booking, LessonTelemetry } from '../types';

interface LessonTrackerProps {
  booking: Booking;
}

// "Flight log" widget shown on a lesson card. During the lesson either party
// starts tracking; afterwards both can review the recorded route.
export const LessonTracker = ({ booking }: LessonTrackerProps) => {
  const { recording, pointCount, error, start, stop } = useLessonTelemetry(booking.id);
  const [logs, setLogs] = useState<LessonTelemetry[]>([]);
  const [expanded, setExpanded] = useState(false);

  const loadLogs = () => {
    platformService.getTelemetryForBooking(booking.id).then(setLogs).catch(() => {});
  };

  useEffect(loadLogs, [booking.id]);

  const completedLogs = logs.filter((l) => l.status === 'completed' && (l.points?.length ?? 0) > 1);

  return (
    <div style={{ borderTop: '1px solid var(--line)', padding: '12px 20px', fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <MapPin size={14} style={{ color: 'var(--cobalt)' }} />
        <span style={{ fontWeight: 600 }}>Route log</span>
        {recording ? (
          <>
            <span style={{ color: '#d64545', fontWeight: 600 }}>● Recording — {pointCount} points</span>
            <button className="sd-btn sd-btn-outline sd-btn-sm" onClick={() => { stop().then(loadLogs); }}>
              <Square size={12} /> Stop & save
            </button>
          </>
        ) : (
          <button className="sd-btn sd-btn-outline sd-btn-sm" onClick={start}>
            <Play size={12} /> Start tracking
          </button>
        )}
        {completedLogs.length > 0 && (
          <button
            className="sd-btn sd-btn-ghost sd-btn-sm"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Hide' : 'View'} recorded route{completedLogs.length > 1 ? 's' : ''} ({completedLogs.length})
          </button>
        )}
      </div>
      {error && <div style={{ color: '#d64545', marginTop: 6 }}>{error}</div>}
      {expanded && completedLogs.map((log) => (
        <div key={log.id} style={{ marginTop: 12 }}>
          <RouteMap telemetry={log} />
        </div>
      ))}
    </div>
  );
};
