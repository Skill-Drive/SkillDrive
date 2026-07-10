import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { platformService } from '../services/platformService';
import type { AvailabilitySlot } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`); // 06:00–20:00

interface AvailabilityEditorProps {
  instructorId: string;
}

// Weekly recurring availability calendar. Learners book instantly into these
// windows via get-available-slots — no confirmation step needed.
export const AvailabilityEditor = ({ instructorId }: AvailabilityEditorProps) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    platformService
      .getAvailability(instructorId)
      .then((data) =>
        setSlots(
          data.map((s) => ({
            ...s,
            start_time: s.start_time.slice(0, 5),
            end_time: s.end_time.slice(0, 5),
          })),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [instructorId]);

  const addSlot = (day: number) =>
    setSlots((prev) => [...prev, { day_of_week: day, start_time: '09:00', end_time: '17:00', is_active: true }]);

  const updateSlot = (idx: number, patch: Partial<AvailabilitySlot>) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const removeSlot = (idx: number) => setSlots((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const valid = slots.filter((s) => s.start_time < s.end_time);
      await platformService.saveAvailability(instructorId, valid);
      setSlots(valid);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Failed to save availability: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: 'var(--cobalt)' }} />;

  return (
    <div className="sd-card" style={{ padding: 24 }}>
      <div className="sd-eyebrow" style={{ marginBottom: 4 }}>// Weekly availability</div>
      <p className="sd-muted" style={{ fontSize: 13, margin: '0 0 16px' }}>
        Learners book instantly into these windows. Leave a day empty to be unavailable.
      </p>
      <div className="sd-col sd-gap-3">
        {DAYS.map((day, dayIdx) => {
          const daySlots = slots.map((s, i) => ({ ...s, _idx: i })).filter((s) => s.day_of_week === dayIdx);
          return (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 10, alignItems: 'start', paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 600, fontSize: 14, paddingTop: 6 }}>{day}</span>
              <div className="sd-col sd-gap-2">
                {daySlots.length === 0 && <span className="sd-muted" style={{ fontSize: 12, paddingTop: 8 }}>Unavailable</span>}
                {daySlots.map((s) => (
                  <div key={s._idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={s.start_time} onChange={(e) => updateSlot(s._idx, { start_time: e.target.value })}
                      style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }}>
                      {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="sd-muted">to</span>
                    <select value={s.end_time} onChange={(e) => updateSlot(s._idx, { end_time: e.target.value })}
                      style={{ padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13 }}>
                      {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <button onClick={() => removeSlot(s._idx)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--coral, #d64545)', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => addSlot(dayIdx)} className="sd-btn sd-btn-ghost sd-btn-sm" style={{ marginTop: 2 }}>
                <Plus size={13} /> Add
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving} className="sd-btn sd-btn-cobalt">
          {saving && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
          Save availability
        </button>
        {saved && <span style={{ color: '#2e9e44', fontSize: 13, fontWeight: 600 }}>Saved ✓</span>}
      </div>
    </div>
  );
};
