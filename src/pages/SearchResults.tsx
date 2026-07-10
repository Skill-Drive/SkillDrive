import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { Icon } from '../components/Icon';

interface Instructor {
  id: string;
  full_name?: string;
  name?: string;
  tagline?: string;
  avatar_url?: string;
  avatar?: string;
  location?: string;
  vehicle?: { transmission?: string; make?: string; model?: string; image_url?: string } | string;
  transmission?: string;
  rating?: number;
  review_count?: number;
  reviews?: number;
  hourly_rate?: number;
  price?: number;
  lessons?: number;
  passRate?: number;
  pass_rate?: number;
  next?: string;
  tags?: string[];
  languages?: string[];
  verified?: boolean;
  suburbs_covered?: string[];
}

function normalise(i: Instructor): Required<Pick<Instructor, 'name'|'avatar'|'transmission'|'rating'|'reviews'|'price'|'lessons'|'passRate'|'next'|'tags'|'languages'|'verified'|'location'|'tagline'>> {
  return {
    tagline: i.tagline || '',
    name: i.full_name || i.name || 'Instructor',
    avatar: i.avatar_url || i.avatar || 'https://i.pravatar.cc/480',
    transmission: i.transmission || (typeof i.vehicle === 'object' ? i.vehicle?.transmission : '') || 'Auto',
    rating: i.rating || 4.9,
    reviews: i.review_count || i.reviews || 0,
    price: i.hourly_rate || i.price || 75,
    lessons: i.lessons || 0,
    passRate: i.pass_rate || i.passRate || 90,
    next: i.next || 'This week',
    tags: i.tags || [],
    languages: i.languages || ['English'],
    verified: i.verified || false,
    location: i.location || (Array.isArray(i.suburbs_covered) ? i.suburbs_covered[0] : '') || '',
  };
}

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postcode = searchParams.get('postcode') || '2010';

  const [dbInstructors, setDbInstructors] = useState<Instructor[]>([]);
  const [filters, setFilters] = useState({ transmission: ['Auto', 'Manual'], maxPrice: 100, minRating: 4.5, dualControl: false, hasTestPackage: false, tags: [] as string[] });
  const [sort, setSort] = useState('recommended');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    bookingService.searchInstructors({
      transmission: filters.transmission,
      maxPrice: filters.maxPrice,
      minRating: filters.minRating,
      dualControl: filters.dualControl,
      hasTestPackage: filters.hasTestPackage,
    }, postcode)
      .then(data => setDbInstructors(data || []))
      .catch(() => {});
  }, [filters.transmission, filters.maxPrice, filters.minRating, filters.dualControl, filters.hasTestPackage, postcode]);

  const source = dbInstructors;

  const filtered = useMemo(() => {
    let r = source.filter(i => {
      const n = normalise(i);
      return filters.transmission.includes(n.transmission) && n.price <= filters.maxPrice && n.rating >= filters.minRating;
    });
    if (sort === 'price') r = [...r].sort((a, b) => normalise(a).price - normalise(b).price);
    if (sort === 'rating') r = [...r].sort((a, b) => normalise(b).rating - normalise(a).rating);
    if (sort === 'experience') r = [...r].sort((a, b) => normalise(b).lessons - normalise(a).lessons);
    return r;
  }, [source, filters, sort]);

  const toggleTrans = (t: string) => setFilters(f => ({ ...f, transmission: f.transmission.includes(t) ? f.transmission.filter(x => x !== t) : [...f.transmission, t] }));

  const pins = useMemo(() => filtered.map((ins, i) => ({
    ...ins,
    x: 15 + ((i * 137) % 70),
    y: 12 + ((i * 211) % 76),
    _n: normalise(ins),
  })), [filtered]);

  return (
    <div className="sd-screen sd-grid-search">
      {/* Filters */}
      <aside style={{ borderRight: '1px solid var(--line)', padding: 24, overflowY: 'auto', background: 'var(--paper)' }}>
        <div className="sd-eyebrow" style={{ marginBottom: 8 }}>// Searching near</div>
        <h2 className="sd-display" style={{ fontSize: 28, margin: '0 0 6px' }}>{postcode} <em style={{ fontSize: 20, color: 'var(--cobalt)' }}>NSW</em></h2>
        <div className="sd-muted" style={{ fontSize: 13, marginBottom: 24 }}>{filtered.length} instructors within 10km</div>

        <FilterSection title="Transmission">
          <div className="sd-row sd-gap-2">
            {['Auto', 'Manual'].map(t => (
              <button key={t} onClick={() => toggleTrans(t)} className="sd-chip" style={{ background: filters.transmission.includes(t) ? 'var(--ink)' : 'var(--surface)', color: filters.transmission.includes(t) ? 'var(--paper)' : 'var(--ink)', cursor: 'pointer', padding: '8px 14px', border: '1px solid var(--ink)' }}>{t}</button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Max hourly rate">
          <div className="sd-row sd-between" style={{ marginBottom: 8, fontSize: 12 }}>
            <span className="sd-mono sd-muted">$50</span>
            <span className="sd-mono" style={{ fontWeight: 700 }}>${filters.maxPrice}/hr</span>
            <span className="sd-mono sd-muted">$150</span>
          </div>
          <input type="range" min="50" max="150" step="5" value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))}
            style={{ width: '100%', accentColor: 'var(--cobalt)' }} />
        </FilterSection>

        <FilterSection title="Minimum rating">
          <div className="sd-row sd-gap-2" style={{ flexWrap: 'wrap' }}>
            {[4.0, 4.5, 4.8, 4.9].map(r => (
              <button key={r} onClick={() => setFilters(f => ({ ...f, minRating: r }))} className="sd-chip"
                style={{ background: filters.minRating === r ? 'var(--cobalt)' : 'var(--surface)', color: filters.minRating === r ? '#fff' : 'var(--ink)', borderColor: filters.minRating === r ? 'var(--cobalt)' : 'var(--line)', cursor: 'pointer' }}>
                <Icon name="star" size={11}/> {r}+
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Vehicle & packages">
          <div className="sd-col sd-gap-2">
            <label className="sd-row sd-acenter sd-gap-2" style={{ fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.dualControl}
                onChange={e => setFilters(f => ({ ...f, dualControl: e.target.checked }))}
                style={{ accentColor: 'var(--cobalt)' }} />
              Dual-control vehicle only
            </label>
            <label className="sd-row sd-acenter sd-gap-2" style={{ fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.hasTestPackage}
                onChange={e => setFilters(f => ({ ...f, hasTestPackage: e.target.checked }))}
                style={{ accentColor: 'var(--cobalt)' }} />
              Offers driving test package
            </label>
          </div>
        </FilterSection>

        <FilterSection title="Specialties">
          <div className="sd-row sd-gap-2" style={{ flexWrap: 'wrap' }}>
            {['Test prep', 'Beginner', 'Refresher', 'Highway', 'Manual', 'EV', 'Women-only', 'Early bird'].map(tag => {
              const on = filters.tags.includes(tag);
              return (
                <button key={tag} onClick={() => setFilters(f => ({ ...f, tags: on ? f.tags.filter(x => x !== tag) : [...f.tags, tag] }))}
                  className="sd-chip" style={{ cursor: 'pointer', background: on ? 'var(--signal)' : 'var(--surface)', borderColor: on ? 'var(--ink)' : 'var(--line)' }}>{tag}</button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Test route prediction" badge="NEW">
          <p className="sd-muted" style={{ fontSize: 13, lineHeight: 1.5, margin: '0 0 12px' }}>Filter instructors who teach <em>your</em> RMS test route.</p>
          <button className="sd-btn sd-btn-outline sd-btn-sm" style={{ width: '100%' }}>Set test route <Icon name="arrow" size={13}/></button>
        </FilterSection>
      </aside>

      {/* Results */}
      <section style={{ overflowY: 'auto', padding: 24, background: 'var(--paper)' }}>
        <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{filtered.length} matches · sorted by</h3>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 999, background: 'var(--surface)', fontSize: 13 }}>
            <option value="recommended">Recommended</option>
            <option value="price">Price: low to high</option>
            <option value="rating">Highest rated</option>
            <option value="experience">Most experienced</option>
          </select>
        </div>

        <div className="sd-col sd-gap-3">
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-mute)' }}>
              No instructors found matching your criteria.
            </div>
          )}
          {filtered.map((ins, idx) => {
            const n = normalise(ins);
            const id = ins.id;
            const isHovered = hovered === id;
            return (
              <article key={id || idx} onClick={() => navigate(`/instructor/${id}`)}
                onMouseEnter={() => setHovered(id || null)}
                onMouseLeave={() => setHovered(null)}
                className="sd-card"
                style={{ padding: 0, cursor: 'pointer', display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 0, overflow: 'hidden', transition: 'transform .15s, box-shadow .15s', transform: isHovered ? 'translateY(-2px)' : 'none', boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow)' }}>
                <div style={{ position: 'relative' }}>
                  <img src={n.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 180 }} alt={n.name}/>
                  <div style={{ position: 'absolute', top: 12, left: 12, fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--ink)', color: 'var(--paper)', padding: '3px 8px', borderRadius: 4 }}>
                    #{String(idx + 1).padStart(2, '0')}
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div className="sd-row sd-between sd-acenter">
                    <div>
                      <h3 className="sd-display" style={{ fontSize: 28, margin: 0, letterSpacing: '-0.01em' }}>{n.name}</h3>
                      <div className="sd-muted" style={{ fontSize: 13, marginTop: 2 }}>{n.tagline || ''}</div>
                    </div>
                    <div className="sd-col" style={{ alignItems: 'flex-end', gap: 4 }}>
                      <div className="sd-row sd-acenter sd-gap-1">
                        <Icon name="star" size={14} style={{ color: 'var(--signal-deep)' }}/>
                        <span style={{ fontWeight: 700 }}>{n.rating}</span>
                        <span className="sd-muted" style={{ fontSize: 12 }}>· {n.reviews}</span>
                      </div>
                      {n.verified && <span className="sd-chip sd-chip-lime" style={{ fontSize: 10, padding: '2px 8px' }}><Icon name="check" size={10}/> Verified</span>}
                    </div>
                  </div>
                  <div className="sd-row sd-gap-2" style={{ marginTop: 14, flexWrap: 'wrap' }}>
                    <span className="sd-chip"><Icon name="car" size={12}/> {n.transmission}</span>
                    {n.location && <span className="sd-chip"><Icon name="pin" size={12}/> {n.location.split(',')[0]}</span>}
                    {n.languages.length > 0 && <span className="sd-chip"><Icon name="lang" size={12}/> {n.languages.join(' · ')}</span>}
                    {n.tags[0] && <span className="sd-chip sd-chip-signal" style={{ fontSize: 11 }}>{n.tags[0]}</span>}
                  </div>
                  <div className="sd-row sd-gap-4" style={{ marginTop: 16, fontSize: 12 }}>
                    <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{n.lessons.toLocaleString()}</div><div className="sd-muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>lessons taught</div></div>
                    <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{n.passRate}%</div><div className="sd-muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>pass rate</div></div>
                    <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--cobalt)' }}>{n.next}</div><div className="sd-muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>next slot</div></div>
                  </div>
                </div>
                <div style={{ padding: 20, borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', minWidth: 140, background: 'var(--paper-2)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sd-eyebrow" style={{ marginBottom: 4 }}>From</div>
                    <div className="sd-display" style={{ fontSize: 36, lineHeight: 1 }}>${n.price}</div>
                    <div className="sd-muted" style={{ fontSize: 11 }}>per hour</div>
                  </div>
                  <button className="sd-btn sd-btn-cobalt sd-btn-sm" onClick={e => { e.stopPropagation(); navigate(`/instructor/${id}`); }}>
                    Open <Icon name="arrow" size={13}/>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Map */}
      <section style={{ position: 'relative', background: 'var(--paper-2)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, var(--cobalt-soft), transparent 35%), linear-gradient(160deg, #DDD7C5, #E7E1CF)', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs><pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(11,16,32,0.06)" strokeWidth="0.3"/></pattern></defs>
            <rect width="100" height="100" fill="url(#grid)"/>
            <path d="M0 22 L100 28" stroke="white" strokeWidth="2" opacity=".9"/>
            <path d="M0 65 Q40 60 100 70" stroke="white" strokeWidth="2" fill="none" opacity=".9"/>
            <path d="M25 0 L40 100" stroke="white" strokeWidth="1.6" opacity=".7"/>
            <path d="M72 0 Q66 50 78 100" stroke="white" strokeWidth="1.6" fill="none" opacity=".7"/>
            <path d="M0 45 L100 48" stroke="white" strokeWidth="0.9" opacity=".55"/>
            <rect x="55" y="55" width="20" height="20" rx="2" fill="#C9DCB8" opacity=".7"/>
            <path d="M75 80 L100 78 L100 100 L80 100 Z" fill="#B7CFE3" opacity=".6"/>
          </svg>

          <div style={{ position: 'absolute', left: '44%', top: '42%', transform: 'translate(-50%, -50%)' }}>
            <div style={{ width: 16, height: 16, borderRadius: 999, background: 'var(--cobalt)', border: '3px solid white', boxShadow: '0 0 0 4px rgba(27,60,255,0.25)' }}/>
            <div style={{ position: 'absolute', left: 22, top: -2, background: 'var(--ink)', color: 'var(--paper)', padding: '3px 9px', fontSize: 10, borderRadius: 4, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>YOU · {postcode}</div>
          </div>

          {pins.map((pin, i) => {
            const active = hovered === pin.id;
            return (
              <button key={pin.id || i} onMouseEnter={() => setHovered(pin.id || null)} onMouseLeave={() => setHovered(null)}
                style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: `translate(-50%, -100%) ${active ? 'scale(1.15)' : ''}`, transition: 'transform .2s', padding: 0, background: 'none', border: 0, zIndex: active ? 10 : 1 }}>
                <div style={{ background: active ? 'var(--cobalt)' : 'var(--ink)', color: active ? '#fff' : 'var(--signal)', padding: '6px 10px 6px 6px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(0,0,0,0.25)', border: '2px solid white' }}>
                  <img src={pin._n.avatar} style={{ width: 22, height: 22, borderRadius: 999, objectFit: 'cover' }} alt=""/>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>${pin._n.price}</span>
                </div>
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `7px solid ${active ? 'var(--cobalt)' : 'var(--ink)'}`, margin: '0 auto', marginTop: -1 }}/>
              </button>
            );
          })}

          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span className="sd-chip" style={{ background: 'var(--surface)', fontSize: 11 }}>Sydney · NSW</span>
            <span className="sd-chip" style={{ background: 'var(--surface)', fontSize: 11 }}>{filtered.length} pins · 10km radius</span>
          </div>
        </div>
      </section>
    </div>
  );
};

function FilterSection({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
      <div className="sd-row sd-acenter sd-gap-2" style={{ marginBottom: 14 }}>
        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{title}</h4>
        {badge && <span className="sd-chip sd-chip-cobalt" style={{ fontSize: 9, padding: '2px 7px' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}
