import { useEffect, useState } from 'react';
import { LifeBuoy, Loader2 } from 'lucide-react';
import { platformService } from '../services/platformService';
import type { Booking, SupportTicket, TicketCategory } from '../types';

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'dispute', label: 'Dispute a lesson' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'billing', label: 'Billing & refunds' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
];

const STATUS_COLORS: Record<string, string> = {
  open: '#d97706',
  in_progress: '#1b3cff',
  resolved: '#2e9e44',
  closed: '#6b7280',
};

interface SupportPanelProps {
  bookings: Booking[];
}

// Help & support tab shared by learner and instructor dashboards:
// submit a ticket (optionally linked to a lesson) and track its status.
export const SupportPanel = ({ bookings }: SupportPanelProps) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<TicketCategory>('technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadTickets = () => {
    platformService.getMyTickets().then(setTickets).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(loadTickets, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      await platformService.createTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
        booking_id: bookingId || null,
      });
      setSubject('');
      setMessage('');
      setBookingId('');
      setFeedback('Ticket submitted — our team will get back to you by email.');
      loadTickets();
    } catch (err: any) {
      setFeedback('Failed to submit ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fld: React.CSSProperties = {
    padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10,
    fontSize: 14, width: '100%', background: 'var(--paper-2)',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
      <div className="sd-card" style={{ padding: 24 }}>
        <div className="sd-row sd-acenter sd-gap-2" style={{ marginBottom: 16 }}>
          <LifeBuoy size={18} style={{ color: 'var(--cobalt)' }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Contact support</h3>
        </div>
        <form onSubmit={handleSubmit} className="sd-col sd-gap-3">
          <div>
            <label className="sd-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} style={fld}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {(category === 'dispute' || category === 'billing') && bookings.length > 0 && (
            <div>
              <label className="sd-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Related lesson (optional)</label>
              <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} style={fld}>
                <option value="">— Select a lesson —</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {new Date(b.start_time).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })} · {b.status}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="sd-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={5} maxLength={120} style={fld} placeholder="Brief summary" />
          </div>
          <div>
            <label className="sd-eyebrow" style={{ display: 'block', marginBottom: 6 }}>Details</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} rows={5} style={{ ...fld, resize: 'vertical' }} placeholder="Tell us what happened…" />
          </div>
          {feedback && <div style={{ fontSize: 13, color: feedback.startsWith('Failed') ? '#d64545' : '#2e9e44' }}>{feedback}</div>}
          <button type="submit" disabled={submitting} className="sd-btn sd-btn-cobalt">
            {submitting && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
            Submit ticket
          </button>
        </form>
      </div>

      <div className="sd-card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>My tickets</h3>
        {loading ? (
          <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: 'var(--cobalt)' }} />
        ) : tickets.length === 0 ? (
          <p className="sd-muted" style={{ fontSize: 13 }}>No support tickets yet.</p>
        ) : (
          <div className="sd-col sd-gap-2">
            {tickets.map((t) => (
              <div key={t.id} style={{ padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10 }}>
                <div className="sd-row sd-between sd-acenter">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{t.subject}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLORS[t.status] }}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="sd-muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {CATEGORIES.find((c) => c.value === t.category)?.label} · {new Date(t.created_at).toLocaleDateString('en-AU')}
                </div>
                {t.admin_notes && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--paper-2)', borderRadius: 8, fontSize: 13 }}>
                    <strong>SkillDrive team:</strong> {t.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
