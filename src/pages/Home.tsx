import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon, Logo } from '../components/Icon';

const MOCK_INSTRUCTORS = [
  { id: 'amelia', name: 'Amelia Tan', tagline: 'Calm coach. Test-route specialist.', location: 'Surry Hills', transmission: 'Auto', rating: 4.97, price: 78, next: 'Tomorrow · 7am', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=480&q=80' },
  { id: 'marcus', name: 'Marcus Okafor', tagline: 'Manual specialist. Ex-rally driver.', location: 'Marrickville', transmission: 'Manual', rating: 4.91, price: 85, next: 'Today · 4:30pm', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=480&q=80' },
  { id: 'priya', name: 'Priya Anand', tagline: 'Test-day nerves? Specialty.', location: 'Parramatta', transmission: 'Auto', rating: 4.99, price: 72, next: 'Tomorrow · 9am', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&q=80' },
];

const TESTIMONIALS = [
  { name: 'Liana, 17', from: 'Newtown', quote: 'Passed first try after 14 lessons with Amelia. The mock tests killed the nerves.' },
  { name: 'Hamza, 22', from: 'Auburn', quote: 'Sara is so patient. I went from terrified to driving the M4 in five weeks.' },
  { name: 'Eve, 35', from: 'Chatswood', quote: "Joel's 6am slots were the only way I could actually get lessons in. License at 35!" },
];

export const Home = () => {
  const [postcode, setPostcode] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?postcode=${postcode || '2010'}`);
  };

  return (
    <div className="sd-screen">
      {/* HERO */}
      <section style={{ borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
        <div className="sd-dots" style={{ position: 'absolute', inset: 0, opacity: 0.18, maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)' }}/>
        <div className="sd-container" style={{ padding: '80px 28px 100px', position: 'relative' }}>
          <div className="sd-row sd-gap-3" style={{ marginBottom: 28, flexWrap: 'wrap' }}>
            <span className="sd-chip sd-chip-cobalt"><Icon name="spark" size={12}/> New • Test-route prediction</span>
            <span className="sd-chip">580 instructors live across NSW</span>
          </div>

          <h1 className="sd-display" style={{ fontSize: 'clamp(64px, 9vw, 132px)', margin: '0 0 28px', maxWidth: 1100 }}>
            The driving instructor<br/>
            <em>you'd recommend</em><br/>
            to your sister.
          </h1>

          <p style={{ fontSize: 20, color: 'var(--ink-mute)', maxWidth: 580, lineHeight: 1.5, margin: '0 0 40px' }}>
            Search, compare, and book a verified driving instructor in your suburb. Real availability. Fixed prices. Zero phone calls.
          </p>

          <form onSubmit={handleSearch} style={{
            background: 'var(--surface)',
            border: '1px solid var(--ink)',
            borderRadius: 999,
            padding: 8,
            display: 'inline-flex',
            gap: 8,
            alignItems: 'center',
            maxWidth: 640,
            width: '100%',
            boxShadow: 'var(--shadow)',
          }}>
            <span style={{ paddingLeft: 14, color: 'var(--cobalt)' }}><Icon name="pin" size={20}/></span>
            <input
              value={postcode}
              onChange={e => setPostcode(e.target.value)}
              placeholder="Suburb or postcode (try 2010)"
              style={{ flex: 1, border: 0, background: 'transparent', fontSize: 17, padding: '10px 0', color: 'var(--ink)', outline: 'none', fontWeight: 500 }}
            />
            <button type="submit" className="sd-btn sd-btn-signal" style={{ border: 'none' }}>
              Compare instructors <Icon name="arrow" size={14}/>
            </button>
          </form>

          <div className="sd-row sd-gap-6" style={{ marginTop: 36, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="sd-row sd-acenter sd-gap-3">
              <div style={{ display: 'flex' }}>
                {[11,12,13,14].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/40?img=${i}`} style={{ width: 32, height: 32, borderRadius: 999, border: '2px solid var(--paper)', marginLeft: i===11?0:-10 }} alt=""/>
                ))}
              </div>
              <div style={{ fontSize: 13 }}>
                <div className="sd-row sd-acenter sd-gap-1" style={{ color: 'var(--ink)' }}>
                  <Icon name="star" size={14} style={{ color: 'var(--signal-deep)' }}/>
                  <span style={{ fontWeight: 700 }}>4.94 avg.</span>
                  <span className="sd-muted">from 52,400 lessons</span>
                </div>
                <div className="sd-muted">Verified by Roads &amp; Maritime Services</div>
              </div>
            </div>
          </div>

          {/* Floating preview card */}
          <div style={{ position: 'absolute', right: 28, top: 90, width: 280, transform: 'rotate(3deg)' }} className="hidden xl:block">
            <div className="sd-card" style={{ overflow: 'hidden', padding: 0, boxShadow: 'var(--shadow-lg)' }}>
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" style={{ width: '100%', height: 200, objectFit: 'cover' }} alt=""/>
              <div style={{ padding: 18 }}>
                <div className="sd-row sd-between sd-acenter">
                  <div className="sd-display" style={{ fontSize: 22 }}>Priya Anand</div>
                  <span className="sd-chip sd-chip-lime"><Icon name="check" size={11}/> Verified</span>
                </div>
                <div className="sd-muted" style={{ fontSize: 13, marginBottom: 10 }}>Parramatta · Hyundai i30 Auto</div>
                <div className="sd-row sd-between sd-acenter">
                  <div className="sd-row sd-acenter sd-gap-2">
                    <Icon name="star" size={14} style={{ color: 'var(--signal-deep)' }}/>
                    <span style={{ fontWeight: 700 }}>4.99</span>
                  </div>
                  <div className="sd-display" style={{ fontSize: 22 }}>$72<span className="sd-muted" style={{ fontSize: 12 }}>/hr</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS TICKER */}
      <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--ink)', color: 'var(--paper)' }}>
        <div className="sd-container sd-row" style={{ padding: '18px 28px', gap: 56, flexWrap: 'wrap' }}>
          {[
            { k: '580+', v: 'verified instructors' },
            { k: '52,400', v: 'lessons booked' },
            { k: '4.94', v: 'average rating' },
            { k: '92%', v: 'first-try pass rate' },
            { k: '0', v: 'phone calls required' },
          ].map((s, i) => (
            <div key={i} className="sd-row sd-acenter sd-gap-3">
              <span className="sd-display" style={{ fontSize: 32, color: 'var(--signal)', lineHeight: 1 }}>{s.k}</span>
              <span style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="sd-container" style={{ padding: '96px 28px 40px' }}>
        <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="sd-eyebrow" style={{ marginBottom: 12 }}>// How it works</div>
            <h2 className="sd-display" style={{ fontSize: 64, margin: 0, maxWidth: 720 }}>
              Three steps. <em>No phone tag.</em>
            </h2>
          </div>
          <Link to="/search" className="sd-btn sd-btn-outline" style={{ textDecoration: 'none' }}>
            Skip ahead <Icon name="arrow" size={16}/>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { n: '01', title: 'Search by postcode', body: 'Map view of every verified instructor within 10km. Filter for transmission, women-only, EV, early-bird, you name it.', icon: 'search' },
            { n: '02', title: 'Pick a slot, lock it in', body: 'Real-time calendar. Pay a $1 hold, settle the rest after your lesson. No deposit lost if life happens.', icon: 'calendar' },
            { n: '03', title: 'Drive. Pass. Done.', body: 'Track lessons, see your test-route progress, get a pass-prediction score. Reschedule up to 24h before.', icon: 'graduation' },
          ].map((step, i) => (
            <article key={i} className="sd-card" style={{ padding: 28, position: 'relative', overflow: 'hidden', aspectRatio: '3/3.5' }}>
              <div style={{ position: 'absolute', top: -14, right: -10, fontFamily: 'var(--font-display)', fontSize: 180, color: 'var(--paper-2)', lineHeight: 0.8 }}>{step.n}</div>
              <div style={{ position: 'relative', height: '100%' }} className="sd-col sd-between">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--cobalt)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={step.icon} size={22}/>
                </div>
                <div>
                  <h3 className="sd-display" style={{ fontSize: 36, margin: '0 0 12px', letterSpacing: '-0.015em' }}>{step.title}</h3>
                  <p className="sd-muted" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FEATURED INSTRUCTORS */}
      <section className="sd-container" style={{ padding: '60px 28px' }}>
        <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 28 }}>
          <div>
            <div className="sd-eyebrow" style={{ marginBottom: 8 }}>// Top-rated this week</div>
            <h2 className="sd-display" style={{ fontSize: 48, margin: 0 }}>The <em>regulars</em></h2>
          </div>
          <Link to="/search" className="sd-btn sd-btn-ghost sd-btn-sm" style={{ textDecoration: 'none' }}>See all 580 <Icon name="arrow" size={14}/></Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {MOCK_INSTRUCTORS.map(ins => (
            <article key={ins.id} onClick={() => navigate(`/instructor/${ins.id}`)} className="sd-card" style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', aspectRatio: '5/3', overflow: 'hidden' }}>
                <img src={ins.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={ins.name}/>
                <div style={{ position: 'absolute', top: 14, left: 14 }}>
                  <span className="sd-chip sd-chip-ink">{ins.transmission}</span>
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <span className="sd-chip" style={{ background: 'var(--surface)' }}>
                    <Icon name="star" size={11} style={{ color: 'var(--signal-deep)' }}/> {ins.rating}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: 14, left: 14, color: 'white', textShadow: '0 2px 12px rgba(0,0,0,.6)' }}>
                  <div className="sd-display" style={{ fontSize: 32, lineHeight: 1 }}>{ins.name}</div>
                  <div style={{ fontSize: 13, marginTop: 4, opacity: .9 }}>{ins.tagline}</div>
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div className="sd-row sd-between sd-acenter">
                  <div className="sd-row sd-acenter sd-gap-2 sd-muted" style={{ fontSize: 13 }}>
                    <Icon name="pin" size={14}/> {ins.location}
                  </div>
                  <div className="sd-row sd-acenter sd-gap-1 sd-muted" style={{ fontSize: 13 }}>
                    <Icon name="clock" size={14}/> {ins.next}
                  </div>
                </div>
                <div className="sd-row sd-between sd-acenter" style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                  <div>
                    <span className="sd-display" style={{ fontSize: 28 }}>${ins.price}</span>
                    <span className="sd-muted" style={{ fontSize: 13 }}> /hr</span>
                  </div>
                  <button className="sd-btn sd-btn-outline sd-btn-sm">View <Icon name="arrow" size={14}/></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '96px 0', marginTop: 60 }}>
        <div className="sd-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <div className="sd-eyebrow" style={{ color: 'var(--signal)', marginBottom: 14 }}>// Why SkillDrive</div>
              <h2 className="sd-display" style={{ fontSize: 88, margin: '0 0 28px', color: 'var(--paper)', lineHeight: 0.95 }}>
                Built like a <em style={{ color: 'var(--signal)' }}>good lesson.</em><br/>Calm, structured, repeatable.
              </h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: 18, lineHeight: 1.6, maxWidth: 540 }}>
                Most learner-driver marketplaces are glorified phone books. We ran the numbers — <span style={{ color: 'var(--paper)' }}>74% of students</span> who use a calendar-first platform pass their test first try, vs. 51% on call-around schools. So we built one.
              </p>
              <div className="sd-row sd-gap-3" style={{ marginTop: 36 }}>
                <Link to="/search" className="sd-btn sd-btn-signal sd-btn-lg" style={{ textDecoration: 'none' }}>
                  Find one near you <Icon name="arrow" size={16}/>
                </Link>
                <Link to="/teach" className="sd-btn sd-btn-ghost sd-btn-lg" style={{ color: 'var(--paper)', borderColor: 'var(--line-strong)', textDecoration: 'none' }}>
                  Teach with us
                </Link>
              </div>
            </div>
            <div className="sd-col sd-gap-4">
              {[
                { k: 'Calendar-first', v: 'Real-time slots. Book or reschedule in 6 clicks, never a phone call.', icon: 'calendar' },
                { k: 'Verified humans', v: 'Every instructor is RMS-licensed, working-with-children-checked, and reviewed.', icon: 'shield' },
                { k: 'Transparent pricing', v: 'Hourly rate up front. No package lock-in, no cancellation traps.', icon: 'wallet' },
                { k: 'Switch any time', v: "Don't vibe with your instructor? Swap with one click. We refund unused hours.", icon: 'trend' },
              ].map((b, i) => (
                <div key={i} className="sd-row sd-gap-4" style={{ padding: '20px 22px', borderTop: i === 0 ? '1px solid var(--line-strong)' : 0, borderBottom: '1px solid var(--line-strong)' }}>
                  <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: 'var(--paper)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={b.icon} size={20}/>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--paper)', marginBottom: 4 }}>{b.k}</div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>{b.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="sd-container" style={{ padding: '96px 28px' }}>
        <div className="sd-eyebrow" style={{ marginBottom: 12 }}>// Pass stories</div>
        <h2 className="sd-display" style={{ fontSize: 56, margin: '0 0 40px' }}>People who <em>passed.</em></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="sd-card" style={{ padding: 28, margin: 0 }}>
              <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 16 }}>
                <span className="sd-chip sd-chip-lime"><Icon name="check" size={12}/> Passed first try</span>
                <span className="sd-display" style={{ fontSize: 28, color: 'var(--cobalt)' }}>L→P</span>
              </div>
              <blockquote className="sd-display" style={{ fontSize: 24, lineHeight: 1.25, letterSpacing: '-0.01em', margin: '0 0 20px' }}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="sd-row sd-acenter sd-gap-3" style={{ fontSize: 13 }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--cobalt)' }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div className="sd-muted">{t.from}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="sd-container" style={{ padding: '0 28px 96px' }}>
        <div style={{ background: 'var(--signal)', borderRadius: 28, padding: '60px 56px', position: 'relative', overflow: 'hidden', border: '1px solid var(--ink)' }}>
          <div className="sd-hatch" style={{ position: 'absolute', inset: 0, opacity: 0.06 }}/>
          <div className="sd-row sd-between sd-acenter" style={{ position: 'relative', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="sd-eyebrow" style={{ marginBottom: 10, color: 'var(--ink)' }}>// Ready when you are</div>
              <h3 className="sd-display" style={{ fontSize: 56, margin: 0, color: 'var(--ink)' }}>
                Find your instructor in <em style={{ color: 'var(--cobalt)' }}>under a minute.</em>
              </h3>
            </div>
            <Link to="/search" className="sd-btn sd-btn-cobalt sd-btn-lg" style={{ textDecoration: 'none' }}>
              Start the search <Icon name="arrow" size={16}/>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--line)', padding: '56px 0 40px', background: 'var(--paper-2)' }}>
        <div className="sd-container">
          <div className="sd-row sd-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 40 }}>
            <div style={{ maxWidth: 320 }}>
              <div className="sd-row sd-acenter sd-gap-3" style={{ marginBottom: 14 }}>
                <Logo size={32}/>
                <span className="sd-display" style={{ fontSize: 22 }}>Skill<em style={{ color: 'var(--cobalt)' }}>Drive</em></span>
              </div>
              <p className="sd-muted" style={{ fontSize: 14, lineHeight: 1.55 }}>The booking platform that actually wants you to pass. Made in Sydney.</p>
            </div>
            {[
              { title: 'Learners', items: ['Find an instructor', 'How it works', 'Test routes', 'Gift lessons'] },
              { title: 'Instructors', items: ['Teach with us', 'Pricing', 'Resources', 'Community'] },
              { title: 'Company', items: ['About', 'Press', 'Careers', 'Contact'] },
            ].map((col, i) => (
              <div key={i}>
                <div className="sd-eyebrow" style={{ marginBottom: 14 }}>{col.title}</div>
                <div className="sd-col sd-gap-2">
                  {col.items.map(item => <a key={item} href="#" style={{ color: 'var(--ink-2)', fontSize: 14, textDecoration: 'none' }}>{item}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div className="sd-row sd-between" style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)', fontSize: 12 }}>
            <span className="sd-muted">© 2026 SkillDrive Pty Ltd · ABN 12 345 678 901</span>
            <span className="sd-muted">Privacy · Terms · Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
