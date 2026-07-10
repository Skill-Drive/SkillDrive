import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Icon } from '../components/Icon';

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--line)' }}>
      <button onClick={() => setOpen(!open)} className="sd-row sd-between sd-acenter" style={{ width: '100%', padding: '18px 0', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
        <span className="sd-display" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>{q}</span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'var(--ink-mute)' }}>
          <Icon name="chev-down" size={18}/>
        </span>
      </button>
      {open && <div className="sd-muted" style={{ fontSize: 14, lineHeight: 1.6, paddingBottom: 18, maxWidth: 600 }}>{a}</div>}
    </div>
  );
}

export const Teach = () => {
  const [hours, setHours] = useState(25);
  const [rate, setRate] = useState(78);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const weekly = hours * rate * 0.85;
  const monthly = weekly * 4.3;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: functionError } = await supabase.functions.invoke('invite-instructor', { body: { email } });
      if (functionError) throw functionError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  const th: React.CSSProperties = { textAlign: 'left', padding: '16px 20px', fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--ink-mute)' };
  const td: React.CSSProperties = { padding: '16px 20px', fontSize: 14 };

  return (
    <div className="sd-screen">
      {/* HERO */}
      <section style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
        <div className="sd-container sd-grid-2" style={{ padding: '80px 28px', alignItems: 'center' }}>
          <div>
            <div className="sd-eyebrow" style={{ marginBottom: 16 }}>// For instructors</div>
            <h1 className="sd-display" style={{ fontSize: 'clamp(64px, 8vw, 112px)', margin: 0, lineHeight: 0.92 }}>
              Stop chasing students.<br/>
              <em>Start teaching</em> them.
            </h1>
            <p style={{ fontSize: 19, color: 'var(--ink-mute)', lineHeight: 1.55, maxWidth: 540, margin: '28px 0 32px' }}>
              SkillDrive fills your calendar with verified, paying learners in your suburbs. You set the rate. We handle the booking, the payment, the no-shows.
            </p>
            <div className="sd-row sd-gap-3">
              <a href="#apply" className="sd-btn sd-btn-cobalt sd-btn-lg" style={{ textDecoration: 'none' }}>Apply to join <Icon name="arrow" size={16}/></a>
              <button className="sd-btn sd-btn-ghost sd-btn-lg"><Icon name="play" size={14}/> Watch the 90-sec tour</button>
            </div>
            <div className="sd-row sd-gap-6" style={{ marginTop: 32, fontSize: 13, flexWrap: 'wrap' }}>
              <div className="sd-row sd-acenter sd-gap-2"><Icon name="check" size={14} style={{ color: 'var(--green)' }}/> 15% platform fee · no other costs</div>
              <div className="sd-row sd-acenter sd-gap-2"><Icon name="check" size={14} style={{ color: 'var(--green)' }}/> Weekly payouts</div>
            </div>
          </div>

          {/* Earnings calculator */}
          <div style={{ position: 'relative' }}>
            <div className="sd-card" style={{ padding: 24, background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' }}>
              <div className="sd-eyebrow" style={{ color: 'var(--signal)' }}>// Your earnings · live calculator</div>
              <div className="sd-row sd-between sd-acenter" style={{ marginTop: 14, marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>Lessons per week</span>
                <span className="sd-mono" style={{ color: 'var(--signal)', fontWeight: 700, fontSize: 14 }}>{hours} hrs</span>
              </div>
              <input type="range" min="5" max="40" value={hours} onChange={e => setHours(+e.target.value)} style={{ width: '100%', accentColor: 'var(--signal)' }}/>
              <div className="sd-row sd-between sd-acenter" style={{ marginTop: 14, marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>Your hourly rate</span>
                <span className="sd-mono" style={{ color: 'var(--signal)', fontWeight: 700, fontSize: 14 }}>${rate}/hr</span>
              </div>
              <input type="range" min="55" max="120" step="1" value={rate} onChange={e => setRate(+e.target.value)} style={{ width: '100%', accentColor: 'var(--signal)' }}/>
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Take-home / month</div>
                <div className="sd-display" style={{ fontSize: 72, color: 'var(--signal)', lineHeight: 1, marginTop: 6 }}>
                  ${Math.round(monthly).toLocaleString()}
                </div>
                <div className="sd-muted" style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 6 }}>
                  ${Math.round(weekly)} / week · after the 15% platform fee
                </div>
              </div>
              <div className="sd-row sd-gap-2" style={{ marginTop: 20, fontSize: 11 }}>
                <span className="sd-chip" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--paper)', borderColor: 'rgba(255,255,255,.1)' }}>Avg rate · $78</span>
                <span className="sd-chip" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--paper)', borderColor: 'rgba(255,255,255,.1)' }}>Top earners · $4.2k/mo</span>
              </div>
            </div>
            <div className="sd-card" style={{ position: 'absolute', top: -20, right: -16, padding: '10px 14px', background: 'var(--signal)', border: '1px solid var(--ink)', transform: 'rotate(4deg)', fontSize: 12, fontWeight: 700 }}>
              No cancellation losses
            </div>
            <div className="sd-card" style={{ position: 'absolute', bottom: -20, left: -16, padding: '10px 14px', background: 'var(--lime)', border: '1px solid var(--ink)', transform: 'rotate(-3deg)', fontSize: 12, fontWeight: 700 }}>
              Paid weekly
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="sd-container" style={{ padding: '96px 28px' }}>
        <div className="sd-eyebrow" style={{ marginBottom: 12 }}>// How we stack up</div>
        <h2 className="sd-display" style={{ fontSize: 64, margin: '0 0 40px', maxWidth: 760 }}>The honest <em>side-by-side.</em></h2>
        <div className="sd-card sd-table-wrap" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--paper-2)' }}>
                <th style={th}>What matters</th>
                <th style={th}>Driving school</th>
                <th style={th}>Going solo</th>
                <th style={{ ...th, background: 'var(--ink)', color: 'var(--signal)' }}>SkillDrive</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Who sets your rate', 'School does', 'You do', 'You do'],
                ['Take-home per $80 lesson', '$32 (60% to school)', '$80 (but marketing & admin)', '$68 (15% to SkillDrive)'],
                ['No-show protection', '❌', '❌', '✓ Guaranteed payout'],
                ['Bookings system', 'Phone & paper diary', 'Spreadsheet', 'Real-time calendar'],
                ['Marketing', 'Theirs', 'Yours', 'Ours'],
                ['Exit any time', 'Notice period', '—', 'Yes — no lock-in'],
              ].map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--line)' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ ...td, fontWeight: j === 0 ? 600 : 400, background: j === 3 ? 'var(--cobalt-soft)' : 'transparent' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* HOW TO JOIN */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '96px 0' }}>
        <div className="sd-container">
          <div className="sd-eyebrow" style={{ color: 'var(--signal)', marginBottom: 12 }}>// Apply in 7 days, teach forever</div>
          <h2 className="sd-display" style={{ fontSize: 64, margin: '0 0 56px', color: 'var(--paper)' }}>How you join.</h2>
          <div className="sd-grid-4">
            {[
              { n: '01', t: 'Apply online', d: 'Upload your driving instructor license, WWCC, and a 60-sec intro video. 15 minutes total.' },
              { n: '02', t: 'Verification call', d: '20-min video call with our team. We check your routes, your style, your vibe.' },
              { n: '03', t: 'Vehicle & insurance check', d: 'We confirm dual controls and comprehensive insurance. Done in person or via photos.' },
              { n: '04', t: 'Go live', d: 'Your profile goes live. Most instructors get their first booking within 48 hours.' },
            ].map(s => (
              <div key={s.n}>
                <div className="sd-display" style={{ fontSize: 72, color: 'var(--signal)', lineHeight: 1, marginBottom: 14 }}>{s.n}</div>
                <h3 className="sd-display" style={{ fontSize: 28, margin: '0 0 8px', color: 'var(--paper)' }}>{s.t}</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTRUCTOR VOICES */}
      <section className="sd-container" style={{ padding: '96px 28px' }}>
        <div className="sd-eyebrow" style={{ marginBottom: 12 }}>// From our instructors</div>
        <h2 className="sd-display" style={{ fontSize: 56, margin: '0 0 40px' }}>What it's <em>actually</em> like.</h2>
        <div className="sd-grid-3">
          {[
            { n: 'Amelia Tan', l: 'Surry Hills · 3 yrs on SkillDrive', q: 'I left a school in 2023 and doubled my take-home in a month. I pick my own students, my own hours. Game changer.', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
            { n: 'Marcus Okafor', l: 'Marrickville · 18 months', q: 'The no-show protection alone pays for the 15% fee. I used to lose $300 a week to flakes. Now I lose zero.', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
            { n: 'Sara Halim', l: 'Auburn · 2 yrs', q: 'I came back from maternity leave and had a full calendar in two weeks. Couldn\'t have rebuilt that on my own.', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
          ].map((v, i) => (
            <figure key={i} className="sd-card" style={{ padding: 28, margin: 0 }}>
              <blockquote className="sd-display" style={{ fontSize: 22, lineHeight: 1.3, margin: '0 0 24px' }}>
                &ldquo;{v.q}&rdquo;
              </blockquote>
              <figcaption className="sd-row sd-acenter sd-gap-3">
                <img src={v.img} style={{ width: 44, height: 44, borderRadius: 999, objectFit: 'cover' }} alt={v.n}/>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{v.n}</div>
                  <div className="sd-muted" style={{ fontSize: 12 }}>{v.l}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ + APPLY */}
      <section className="sd-container" style={{ padding: '0 28px 96px' }}>
        <div className="sd-grid-1-4">
          <div>
            <div className="sd-eyebrow" style={{ marginBottom: 12 }}>// Frequently asked</div>
            <h2 className="sd-display" style={{ fontSize: 48, margin: 0 }}>The fine <em>print.</em></h2>
            <p className="sd-muted" style={{ fontSize: 14, marginTop: 16, lineHeight: 1.55 }}>
              Can't find what you're after? Email <a className="sd-ulink" href="mailto:instructors@skilldrive.com.au">instructors@skilldrive.com.au</a>
            </p>
          </div>
          <div className="sd-col">
            {[
              ['What licenses do I need?', 'A current driving instructor license issued by your state (RMS in NSW, VicRoads in Vic, etc.), plus a Working With Children Check.'],
              ['How quickly do I get paid?', 'Weekly. Every Tuesday we settle the previous week\'s lessons. Direct bank deposit.'],
              ['What if a student no-shows?', 'If they miss without 24h notice, you keep 100% of the lesson fee. We charge them, you get paid.'],
              ['Can I keep teaching for a school too?', 'Yes. Many of our instructors do both. SkillDrive is non-exclusive.'],
              ['Do I need a dual-control car?', 'Yes — it\'s an RMS requirement for paid instruction. We\'ll verify yours during onboarding.'],
            ].map((qa, i) => <FAQ key={i} q={qa[0]} a={qa[1]}/>)}
          </div>
        </div>
      </section>

      {/* APPLY FORM */}
      <section id="apply" className="sd-container" style={{ padding: '0 28px 96px' }}>
        <div style={{ background: 'var(--signal)', borderRadius: 28, padding: '60px 56px', position: 'relative', overflow: 'hidden', border: '1px solid var(--ink)', maxWidth: 680 }}>
          <div className="sd-hatch" style={{ position: 'absolute', inset: 0, opacity: 0.06 }}/>
          <div style={{ position: 'relative' }}>
            <div className="sd-eyebrow" style={{ marginBottom: 10, color: 'var(--ink)' }}>// Apply to join</div>
            <h2 className="sd-display" style={{ fontSize: 48, margin: '0 0 24px', color: 'var(--ink)' }}>
              {success ? <em>Application sent!</em> : <>Get your <em>invite.</em></>}
            </h2>
            {success ? (
              <div>
                <p style={{ fontSize: 16, color: 'var(--ink-2)', marginBottom: 0 }}>We'll be in touch within 2 business days. Check your inbox.</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="sd-row sd-gap-3" style={{ alignItems: 'flex-end' }}>
                <div className="sd-col sd-gap-2" style={{ flex: 1 }}>
                  <span className="sd-eyebrow">Your email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="instructor@example.com"
                    style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--ink)', borderRadius: 12, fontSize: 15, outline: 'none', color: 'var(--ink)', width: '100%' }}
                  />
                </div>
                <button type="submit" disabled={loading} className="sd-btn sd-btn-cobalt sd-btn-lg" style={{ flexShrink: 0 }}>
                  {loading ? 'Sending...' : <>Apply now <Icon name="arrow" size={16}/></>}
                </button>
              </form>
            )}
            {error && <p style={{ color: 'var(--coral)', fontSize: 14, marginTop: 12 }}>{error}</p>}
          </div>
        </div>
      </section>
    </div>
  );
};
