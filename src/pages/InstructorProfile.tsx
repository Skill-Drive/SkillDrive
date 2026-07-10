import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { Icon } from '../components/Icon';
import type { InstructorProfile as IInstructorProfile } from '../types';

const MOCK: Record<string, { name: string; avatar: string; car: string; bio: string; tagline: string; tags: string[]; languages: string[]; rating: number; reviews: number; price: number; lessons: number; passRate: number; transmission: string; vehicle: string; suburbs: string[] }> = {
  amelia: { name: 'Amelia Tan', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=480&q=80', car: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80', bio: 'Twelve years teaching learners in inner Sydney. I focus on the test routes around RMS Rosebery — calm, structured, never rushed.', tagline: 'Calm coach. Test-route specialist.', tags: ['Test-route prep', 'Nervous drivers', 'Refresher'], languages: ['English', 'Mandarin'], rating: 4.97, reviews: 412, price: 78, lessons: 1840, passRate: 94, transmission: 'Auto', vehicle: '2023 Toyota Corolla Hybrid', suburbs: ['Surry Hills', 'Redfern', 'Paddington', 'Darlinghurst', 'Newtown', 'Glebe'] },
  marcus: { name: 'Marcus Okafor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=480&q=80', car: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=80', bio: 'I teach proper manual technique — heel-toe, hill starts, the works. Patient with first-timers but won\'t let you cheat the clutch.', tagline: 'Manual specialist. Ex-rally driver.', tags: ['Manual', 'Highway', 'Defensive'], languages: ['English'], rating: 4.91, reviews: 287, price: 85, lessons: 1210, passRate: 91, transmission: 'Manual', vehicle: '2021 Mazda 3 Manual', suburbs: ['Marrickville', 'Tempe', 'St Peters', 'Sydenham'] },
  priya: { name: 'Priya Anand', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&q=80', car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80', bio: "I've been on Parramatta test routes since 2014. Most of my students pass first try. We'll do mock tests until you stop flinching.", tagline: 'Test-day nerves? Specialty.', tags: ['Test prep', 'Mock tests', 'First try'], languages: ['English', 'Hindi', 'Tamil'], rating: 4.99, reviews: 524, price: 72, lessons: 2310, passRate: 96, transmission: 'Auto', vehicle: '2024 Hyundai i30', suburbs: ['Parramatta', 'Westmead', 'Harris Park', 'Granville'] },
};

const DAYS = [
  { d: 'Wed', n: '14', slots: [] as string[] },
  { d: 'Thu', n: '15', slots: ['7:00 am', '9:30 am', '2:00 pm'] },
  { d: 'Fri', n: '16', slots: ['10:00 am', '4:00 pm'] },
  { d: 'Sat', n: '17', slots: ['7:00 am', '9:00 am', '11:00 am', '1:30 pm'] },
  { d: 'Sun', n: '18', slots: ['10:00 am', '12:00 pm'] },
  { d: 'Mon', n: '19', slots: ['6:00 am', '7:00 am', '4:00 pm', '6:00 pm'] },
  { d: 'Tue', n: '20', slots: ['7:00 am', '9:00 am', '2:30 pm'] },
];

const CURRICULUM = [
  { title: 'Cockpit drill & controls', duration: 2, status: 'done' },
  { title: 'Quiet streets, gear selection', duration: 4, status: 'done' },
  { title: 'Roundabouts & lane discipline', duration: 5, status: 'done' },
  { title: 'Parking — parallel, reverse, 3-point', duration: 6, status: 'current' },
  { title: 'Heavy traffic & merging', duration: 5, status: 'next' },
  { title: 'Test-route rehearsal', duration: 8, status: 'next' },
  { title: 'Mock driving test', duration: 2, status: 'next' },
];

const REVIEWS = [
  { name: 'Liana M.', date: '2 weeks ago', rating: 5, text: 'Passed first try thanks to Amelia. Her mock tests were tougher than the real thing — which is exactly what you want.' },
  { name: 'Tom K.', date: '1 month ago', rating: 5, text: "I'd been put off driving by a bad first instructor. Amelia rebuilt my confidence in 4 lessons." },
  { name: 'Mei L.', date: '1 month ago', rating: 4, text: 'Excellent. Lost a star only because she\'s so popular it took me 3 weeks to get my preferred slot.' },
  { name: 'Diego R.', date: '2 months ago', rating: 5, text: 'Bilingual lessons made it so much easier for my mum to come along and listen.' },
];

export const InstructorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dbInstructor, setDbInstructor] = useState<IInstructorProfile | null>(null);
  const [tab, setTab] = useState<'about' | 'plan' | 'reviews' | 'vehicle'>('about');
  const [bookingStep, setBookingStep] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(2);

  useEffect(() => {
    if (id) {
      bookingService.getInstructor(id)
        .then(data => setDbInstructor(data))
        .catch(() => {});
    }
  }, [id]);

  const mock = MOCK[id || ''] || MOCK.amelia;
  const ins = {
    name: dbInstructor?.full_name || mock.name,
    avatar: dbInstructor?.avatar_url || mock.avatar,
    car: dbInstructor?.vehicle?.image_url || mock.car,
    bio: mock.bio,
    tagline: mock.tagline,
    tags: mock.tags,
    languages: mock.languages,
    rating: dbInstructor?.rating || mock.rating,
    reviews: dbInstructor?.review_count || mock.reviews,
    price: dbInstructor?.hourly_rate || mock.price,
    lessons: mock.lessons,
    passRate: mock.passRate,
    transmission: dbInstructor?.vehicle?.transmission || mock.transmission,
    vehicle: dbInstructor ? (dbInstructor.vehicle?.model || mock.vehicle) : mock.vehicle,
    suburbs: dbInstructor?.suburbs_covered || mock.suburbs,
  };

  const fldStyle: React.CSSProperties = { padding: '12px 14px', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 14, outline: 'none', color: 'var(--ink)', width: '100%' };

  return (
    <div className="sd-screen">
      {/* Sub-nav */}
      <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
        <div className="sd-container sd-row sd-acenter sd-between" style={{ padding: '14px 28px' }}>
          <button onClick={() => navigate('/search')} className="sd-btn sd-btn-ghost sd-btn-sm">
            <Icon name="chev-left" size={14}/> Back to results
          </button>
          <div className="sd-row sd-gap-3 sd-muted" style={{ fontSize: 12, alignItems: 'center' }}>
            <span>Sydney</span><Icon name="chev-right" size={12}/><span>{ins.transmission}</span><Icon name="chev-right" size={12}/><span style={{ color: 'var(--ink)' }}>{ins.name}</span>
          </div>
        </div>
      </div>

      {/* Hero band */}
      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '48px 0 64px', position: 'relative', overflow: 'hidden' }}>
        <div className="sd-dots" style={{ position: 'absolute', inset: 0, opacity: 0.08 }}/>
        <div className="sd-container" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 36, alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <img src={ins.avatar} style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 24, border: '3px solid var(--signal)' }} alt={ins.name}/>
            <span className="sd-chip sd-chip-signal" style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}>
              <Icon name="check" size={11}/> Verified
            </span>
          </div>
          <div>
            <div className="sd-eyebrow" style={{ color: 'var(--signal)', marginBottom: 12 }}>// Top instructor · Sydney</div>
            <h1 className="sd-display" style={{ fontSize: 80, margin: 0, color: 'var(--paper)', lineHeight: 0.95 }}>
              {ins.name.split(' ')[0]} <em style={{ color: 'var(--signal)' }}>{ins.name.split(' ').slice(1).join(' ')}</em>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--ink-soft)', margin: '12px 0 24px', maxWidth: 540 }}>{ins.bio}</p>
            <div className="sd-row sd-gap-2" style={{ flexWrap: 'wrap' }}>
              {ins.tags.map(t => <span key={t} className="sd-chip sd-chip-signal" style={{ fontSize: 12 }}>{t}</span>)}
              <span className="sd-chip" style={{ background: 'transparent', borderColor: 'var(--line-strong)', color: 'var(--paper)' }}>
                <Icon name="lang" size={12}/> {ins.languages.join(' · ')}
              </span>
            </div>
          </div>
          <div className="sd-col sd-gap-3" style={{ textAlign: 'right' }}>
            <div>
              <div className="sd-eyebrow" style={{ color: 'var(--ink-soft)', marginBottom: 4 }}>Hourly</div>
              <div className="sd-display" style={{ fontSize: 64, color: 'var(--paper)', lineHeight: 1 }}>${ins.price}</div>
              <div className="sd-muted" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>+ free pickup within 5km</div>
            </div>
            <button onClick={() => setBookingStep('slot')} className="sd-btn sd-btn-signal sd-btn-lg">
              Book a lesson <Icon name="arrow" size={16}/>
            </button>
          </div>
        </div>
        {/* Stat strip */}
        <div className="sd-container" style={{ marginTop: 48, position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--line-strong)', borderBottom: '1px solid var(--line-strong)' }}>
            {[
              { k: ins.rating, v: `Rating · ${ins.reviews} reviews` },
              { k: ins.lessons.toLocaleString(), v: 'Lessons taught' },
              { k: `${ins.passRate}%`, v: 'Pass rate first try' },
              { k: '<5km', v: 'Pickup radius · free' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 24px', borderLeft: i === 0 ? 0 : '1px solid var(--line-strong)' }}>
                <div className="sd-display" style={{ fontSize: 44, color: 'var(--signal)', lineHeight: 1 }}>{s.k}</div>
                <div className="sd-eyebrow" style={{ marginTop: 6, color: 'var(--ink-soft)' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="sd-container" style={{ padding: '48px 28px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>
        {/* MAIN */}
        <div>
          {/* Tabs */}
          <div className="sd-row sd-gap-1" style={{ borderBottom: '1px solid var(--line)', marginBottom: 28 }}>
            {(['about', 'plan', 'reviews', 'vehicle'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 18px', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--ink)' : 'var(--ink-mute)', borderBottom: tab === t ? '2px solid var(--cobalt)' : '2px solid transparent', marginBottom: -1 }}>
                {t === 'about' ? 'About' : t === 'plan' ? 'Lesson plan' : t === 'reviews' ? `Reviews (${ins.reviews})` : 'Vehicle'}
              </button>
            ))}
          </div>

          {tab === 'about' && (
            <div className="sd-col sd-gap-6">
              <ContentBlock title="About">
                <p style={{ fontSize: 17, lineHeight: 1.65, margin: 0 }}>{ins.bio} I trained at Australian Driver Training Institute and have been certified by RMS continuously. I drive the major Sydney test routes weekly so I can rehearse them with you before the big day.</p>
              </ContentBlock>
              <ContentBlock title="Service areas">
                <div className="sd-row sd-gap-2" style={{ flexWrap: 'wrap' }}>
                  {ins.suburbs.map(s => <span key={s} className="sd-chip">{s}</span>)}
                </div>
              </ContentBlock>
              <ContentBlock title="Pricing">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { t: 'Single lesson', price: `$${ins.price}`, sub: '60 min · pay after', flag: null },
                    { t: 'Standard 1.5hr', price: `$${Math.round(ins.price * 1.5)}`, sub: '90 min · most popular', flag: 'Recommended' },
                    { t: 'Test-prep bundle', price: `$${ins.price * 10 - 120}`, sub: '10 hrs · best value', flag: 'Best value' },
                  ].map((p, i) => (
                    <div key={i} className="sd-card" style={{ padding: 18, position: 'relative', borderColor: p.flag === 'Recommended' ? 'var(--cobalt)' : 'var(--line)', borderWidth: p.flag === 'Recommended' ? 2 : 1 }}>
                      {p.flag && <span className="sd-chip sd-chip-cobalt" style={{ position: 'absolute', top: -10, left: 14, fontSize: 10 }}>{p.flag}</span>}
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.t}</div>
                      <div className="sd-display" style={{ fontSize: 32 }}>{p.price}</div>
                      <div className="sd-muted" style={{ fontSize: 12 }}>{p.sub}</div>
                    </div>
                  ))}
                </div>
              </ContentBlock>
            </div>
          )}

          {tab === 'plan' && (
            <ContentBlock title={`Lesson plan with ${ins.name.split(' ')[0]}`} sub={`18 of 32 required hours · 56% complete`}>
              <div style={{ height: 8, background: 'var(--paper-2)', borderRadius: 999, overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ width: '56%', height: '100%', background: 'linear-gradient(90deg, var(--cobalt), var(--signal))' }}/>
              </div>
              <div className="sd-col sd-gap-2">
                {CURRICULUM.map((c, i) => (
                  <div key={i} className="sd-row sd-acenter sd-gap-4" style={{ padding: '16px 20px', background: c.status === 'current' ? 'var(--cobalt-soft)' : 'var(--surface)', borderRadius: 12, border: `1px solid ${c.status === 'current' ? 'var(--cobalt)' : 'var(--line)'}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: c.status === 'done' ? 'var(--cobalt)' : c.status === 'current' ? 'var(--signal)' : 'var(--paper-2)', color: c.status === 'done' ? '#fff' : 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>
                      {c.status === 'done' ? <Icon name="check" size={16}/> : String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="sd-grow">
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{c.title}</div>
                      <div className="sd-muted" style={{ fontSize: 12 }}>{c.duration} hrs · {c.status === 'done' ? 'Completed' : c.status === 'current' ? 'In progress' : 'Up next'}</div>
                    </div>
                    {c.status === 'current' && <span className="sd-chip sd-chip-signal" style={{ fontSize: 11 }}>Next lesson</span>}
                    {c.status === 'next' && <Icon name="lock" size={14} style={{ color: 'var(--ink-soft)' }}/>}
                  </div>
                ))}
              </div>
            </ContentBlock>
          )}

          {tab === 'reviews' && (
            <ContentBlock title="Reviews">
              <div className="sd-row sd-gap-6" style={{ marginBottom: 32, alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="sd-display" style={{ fontSize: 80, lineHeight: 1 }}>{ins.rating}</div>
                  <div className="sd-row" style={{ justifyContent: 'center', color: 'var(--signal-deep)', gap: 2 }}>
                    {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={16}/>)}
                  </div>
                  <div className="sd-muted" style={{ fontSize: 12, marginTop: 4 }}>{ins.reviews} reviews</div>
                </div>
                <div className="sd-col sd-gap-1 sd-grow" style={{ paddingTop: 14 }}>
                  {[5,4,3,2,1].map(n => {
                    const pct = [88, 9, 2, 1, 0][5-n];
                    return (
                      <div key={n} className="sd-row sd-acenter sd-gap-3" style={{ fontSize: 12 }}>
                        <span style={{ width: 14 }}>{n}</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--paper-2)', borderRadius: 999 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--cobalt)', borderRadius: 999 }}/>
                        </div>
                        <span className="sd-mono sd-muted" style={{ width: 32, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="sd-col sd-gap-3">
                {REVIEWS.map((r, i) => (
                  <div key={i} style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>
                    <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 8 }}>
                      <div className="sd-row sd-acenter sd-gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--cobalt-soft)', color: 'var(--cobalt-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{r.name[0]}</div>
                        <div><div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div><div className="sd-muted" style={{ fontSize: 11 }}>{r.date}</div></div>
                      </div>
                      <div className="sd-row" style={{ color: 'var(--signal-deep)' }}>
                        {[1,2,3,4,5].map(s => <Icon key={s} name="star" size={13} style={{ opacity: s <= r.rating ? 1 : .2 }}/>)}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)' }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </ContentBlock>
          )}

          {tab === 'vehicle' && (
            <ContentBlock title="The car you'll be driving">
              <div className="sd-card" style={{ overflow: 'hidden', padding: 0 }}>
                <img src={ins.car} style={{ width: '100%', height: 280, objectFit: 'cover' }} alt=""/>
                <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
                  {[
                    { k: 'Model', v: ins.vehicle },
                    { k: 'Transmission', v: ins.transmission },
                    { k: 'Dual controls', v: 'Yes — RMS-certified' },
                    { k: 'Insurance', v: 'Comprehensive · learner-covered' },
                  ].map((b, i) => (
                    <div key={i} style={{ paddingRight: 14, borderRight: i < 3 ? '1px solid var(--line)' : 0, paddingLeft: i > 0 ? 14 : 0 }}>
                      <div className="sd-eyebrow" style={{ marginBottom: 6 }}>{b.k}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{b.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ContentBlock>
          )}
        </div>

        {/* Booking sidebar */}
        <aside style={{ position: 'sticky', top: 96 }}>
          <div className="sd-card" style={{ padding: 24, background: 'var(--surface)' }}>
            <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 18 }}>
              <h3 className="sd-display" style={{ margin: 0, fontSize: 28 }}>Pick a time</h3>
              <span className="sd-chip sd-chip-lime" style={{ fontSize: 10 }}>Live calendar</span>
            </div>
            <div className="sd-row sd-gap-2" style={{ marginBottom: 18, overflowX: 'auto', padding: '2px 0' }}>
              {DAYS.map((d, i) => {
                const has = d.slots.length > 0;
                const sel = selectedDay === i;
                return (
                  <button key={i} disabled={!has} onClick={() => setSelectedDay(i)} style={{ flexShrink: 0, padding: '10px 8px', minWidth: 54, borderRadius: 12, border: sel ? '1px solid var(--ink)' : '1px solid var(--line)', background: sel ? 'var(--ink)' : has ? 'var(--surface)' : 'var(--paper-2)', color: sel ? 'var(--paper)' : has ? 'var(--ink)' : 'var(--ink-soft)', cursor: has ? 'pointer' : 'not-allowed', opacity: has ? 1 : 0.5 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', opacity: .8 }}>{d.d}</div>
                    <div className="sd-display" style={{ fontWeight: 700, fontSize: 17 }}>{d.n}</div>
                    <div style={{ fontSize: 9, marginTop: 2, color: sel ? 'var(--signal)' : 'var(--cobalt)' }}>{has ? `${d.slots.length} slots` : '—'}</div>
                  </button>
                );
              })}
            </div>
            <div className="sd-eyebrow" style={{ marginBottom: 10 }}>Available · 90-min lessons</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {DAYS[selectedDay].slots.map(s => (
                <button key={s} onClick={() => { setSelectedSlot(s); setBookingStep('details'); }}
                  style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 10, background: selectedSlot === s ? 'var(--cobalt)' : 'var(--surface)', color: selectedSlot === s ? '#fff' : 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--paper-2)', borderRadius: 12, fontSize: 12 }} className="sd-muted">
              <div className="sd-row sd-between" style={{ marginBottom: 6 }}>
                <span>1.5 hr lesson</span><span className="sd-mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>${Math.round(ins.price * 1.5)}</span>
              </div>
              <div className="sd-row sd-between" style={{ marginBottom: 6 }}>
                <span>Pickup (within 5km)</span><span className="sd-mono" style={{ color: 'var(--green)', fontWeight: 600 }}>Free</span>
              </div>
              <div className="sd-row sd-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, color: 'var(--ink)' }}>
                <span style={{ fontWeight: 700 }}>Hold today</span>
                <span className="sd-mono" style={{ fontWeight: 700 }}>$1.00</span>
              </div>
            </div>
            <button onClick={() => setBookingStep('slot')} className="sd-btn sd-btn-cobalt" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              Continue to booking <Icon name="arrow" size={14}/>
            </button>
            <div className="sd-row sd-gap-2 sd-acenter sd-muted" style={{ marginTop: 14, fontSize: 11, justifyContent: 'center' }}>
              <Icon name="lock" size={11}/> Free cancellation up to 24h before
            </div>
          </div>
        </aside>
      </div>

      {/* BOOKING FLOW MODAL */}
      {bookingStep && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,16,36,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div className="sd-card" style={{ width: '100%', maxWidth: 720, padding: 0, background: 'var(--surface)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sd-row sd-between sd-acenter" style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)' }}>
              <div className="sd-row sd-acenter sd-gap-3">
                <img src={ins.avatar} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} alt=""/>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ins.name}</div>
                  <div className="sd-muted" style={{ fontSize: 11 }}>{selectedSlot ? `${DAYS[selectedDay].d} ${DAYS[selectedDay].n} May · ${selectedSlot}` : 'Pick a slot'}</div>
                </div>
              </div>
              <button onClick={() => setBookingStep(null)} style={{ background: 'none', border: 0, padding: 8, cursor: 'pointer', color: 'var(--ink-mute)' }}>
                <Icon name="close" size={20}/>
              </button>
            </div>

            {/* Progress */}
            <div className="sd-row" style={{ padding: '12px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
              {['Slot', 'Details', 'Pay', 'Confirmed'].map((s, i) => {
                const stepIdx = ['slot','details','pay','done'].indexOf(bookingStep);
                return (
                  <div key={s} className="sd-row sd-acenter sd-gap-2" style={{ flex: 1, color: i <= stepIdx ? 'var(--ink)' : 'var(--ink-soft)' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 999, background: i < stepIdx ? 'var(--cobalt)' : i === stepIdx ? 'var(--ink)' : 'var(--paper)', color: i <= stepIdx ? '#fff' : 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', border: i === stepIdx ? '1px solid var(--ink)' : '1px solid var(--line)' }}>
                      {i < stepIdx ? <Icon name="check" size={12}/> : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s}</span>
                    {i < 3 && <div style={{ flex: 1, height: 1, background: i < stepIdx ? 'var(--cobalt)' : 'var(--line)', marginLeft: 8 }}/>}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: 28, overflowY: 'auto' }}>
              {bookingStep === 'slot' && (
                <div>
                  <h3 className="sd-display" style={{ margin: '0 0 6px', fontSize: 28 }}>Confirm your slot</h3>
                  <p className="sd-muted" style={{ marginTop: 0, fontSize: 14 }}>90-minute lesson with {ins.name}.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 16 }}>
                    {['60 min · $' + ins.price, `90 min · $${Math.round(ins.price * 1.5)} · popular`, `120 min · $${ins.price * 2}`, `180 min · $${ins.price * 3}`].map((opt, i) => (
                      <button key={opt} style={{ padding: 14, border: i === 1 ? '2px solid var(--cobalt)' : '1px solid var(--line)', borderRadius: 12, background: i === 1 ? 'var(--cobalt-soft)' : 'var(--surface)', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600 }}>{opt}</button>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 'details' && (
                <div className="sd-col sd-gap-3">
                  <h3 className="sd-display" style={{ margin: 0, fontSize: 28 }}>A few details</h3>
                  <label className="sd-col sd-gap-2" style={{ flex: 1 }}><span className="sd-eyebrow">Pickup address</span><input placeholder="e.g. 12 Crown St, Surry Hills" defaultValue="12 Crown St, Surry Hills" style={fldStyle}/></label>
                  <label className="sd-col sd-gap-2" style={{ flex: 1 }}><span className="sd-eyebrow">Your phone</span><input placeholder="04xx xxx xxx" defaultValue="0432 119 887" style={fldStyle}/></label>
                  <div>
                    <div className="sd-eyebrow" style={{ marginBottom: 8 }}>Focus this lesson</div>
                    <div className="sd-row sd-gap-2" style={{ flexWrap: 'wrap' }}>
                      {['Parallel parking', 'Roundabouts', 'Test route 1', 'Highway merging', 'Mock test', 'Freestyle'].map((t, i) => (
                        <span key={t} className="sd-chip" style={{ background: i === 2 ? 'var(--ink)' : 'var(--surface)', color: i === 2 ? 'var(--paper)' : 'var(--ink)', borderColor: i === 2 ? 'var(--ink)' : 'var(--line)', cursor: 'pointer' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <label className="sd-col sd-gap-2" style={{ flex: 1 }}><span className="sd-eyebrow">Notes</span><textarea placeholder={`Anything ${ins.name.split(' ')[0]} should know?`} rows={3} style={{ ...fldStyle, resize: 'none' }}/></label>
                </div>
              )}

              {bookingStep === 'pay' && (
                <div>
                  <h3 className="sd-display" style={{ margin: '0 0 8px', fontSize: 28 }}>Hold your spot for $1</h3>
                  <p className="sd-muted" style={{ marginTop: 0, fontSize: 14 }}>We charge $1 now to confirm. The rest settles after your lesson — only if it happens.</p>
                  <div className="sd-col sd-gap-3" style={{ marginTop: 18 }}>
                    <label className="sd-col sd-gap-2"><span className="sd-eyebrow">Card number</span><input placeholder="1234 5678 9012 3456" defaultValue="4242 4242 4242 4242" style={fldStyle}/></label>
                    <div className="sd-row sd-gap-3">
                      <label className="sd-col sd-gap-2" style={{ flex: 1 }}><span className="sd-eyebrow">Expiry</span><input placeholder="MM/YY" defaultValue="04/29" style={fldStyle}/></label>
                      <label className="sd-col sd-gap-2" style={{ flex: 1 }}><span className="sd-eyebrow">CVC</span><input placeholder="123" defaultValue="918" style={fldStyle}/></label>
                    </div>
                  </div>
                  <div style={{ marginTop: 20, padding: 14, background: 'var(--paper-2)', borderRadius: 12, fontSize: 13 }}>
                    <div className="sd-row sd-between"><span>Lesson</span><span className="sd-mono">${Math.round(ins.price * 1.5)}.00</span></div>
                    <div className="sd-row sd-between" style={{ color: 'var(--green)' }}><span>Pickup (5km)</span><span className="sd-mono">Free</span></div>
                    <div className="sd-row sd-between" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}><span style={{ fontWeight: 700 }}>Charged today</span><span className="sd-mono" style={{ fontWeight: 700 }}>$1.00</span></div>
                    <div className="sd-row sd-between sd-muted" style={{ fontSize: 11, marginTop: 4 }}><span>After lesson</span><span className="sd-mono">${Math.round(ins.price * 1.5) - 1}.00</span></div>
                  </div>
                </div>
              )}

              {bookingStep === 'done' && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: 80, height: 80, margin: '0 auto 18px', borderRadius: 999, background: 'var(--lime)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--ink)' }}>
                    <Icon name="check" size={36}/>
                  </div>
                  <h3 className="sd-display" style={{ margin: '0 0 8px', fontSize: 36 }}>You're locked in.</h3>
                  <p className="sd-muted" style={{ margin: '0 auto 24px', maxWidth: 380, fontSize: 14 }}>
                    {DAYS[selectedDay].d} {DAYS[selectedDay].n} May{selectedSlot ? `, ${selectedSlot}` : ''} with {ins.name}. We've added it to your dashboard and sent a calendar invite.
                  </p>
                  <div className="sd-row sd-gap-2" style={{ justifyContent: 'center' }}>
                    <span className="sd-chip sd-chip-cobalt"><Icon name="calendar" size={12}/> Added to Google Calendar</span>
                    <span className="sd-chip"><Icon name="phone" size={12}/> SMS reminder set</span>
                  </div>
                </div>
              )}
            </div>

            <div className="sd-row sd-between sd-acenter" style={{ padding: 18, borderTop: '1px solid var(--line)', background: 'var(--paper-2)' }}>
              <span className="sd-muted" style={{ fontSize: 12 }}>
                {bookingStep !== 'done' ? <><Icon name="lock" size={11}/> Secure checkout · SSL</> : 'Welcome to SkillDrive.'}
              </span>
              {bookingStep === 'slot' && <button onClick={() => setBookingStep('details')} className="sd-btn sd-btn-cobalt">Continue <Icon name="arrow" size={14}/></button>}
              {bookingStep === 'details' && <button onClick={() => setBookingStep('pay')} className="sd-btn sd-btn-cobalt">Continue <Icon name="arrow" size={14}/></button>}
              {bookingStep === 'pay' && <button onClick={() => setBookingStep('done')} className="sd-btn sd-btn-cobalt">Pay $1.00 hold <Icon name="arrow" size={14}/></button>}
              {bookingStep === 'done' && <button onClick={() => { setBookingStep(null); navigate('/dashboard'); }} className="sd-btn sd-btn-cobalt">Go to dashboard <Icon name="arrow" size={14}/></button>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

function ContentBlock({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <h2 className="sd-display" style={{ margin: 0, fontSize: 32, letterSpacing: '-0.01em' }}>{title}</h2>
        {sub && <div className="sd-muted" style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}
      </div>
      {children}
    </section>
  );
}
