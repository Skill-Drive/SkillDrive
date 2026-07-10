import React, { useEffect, useState } from 'react';
import { format, parseISO, isFuture } from 'date-fns';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Camera } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { Icon } from '../components/Icon';
import { LogbookCard } from '../components/LogbookCard';
import { SupportPanel } from '../components/SupportPanel';
import { RescheduleModal } from '../components/RescheduleModal';
import { AvailabilityEditor } from '../components/AvailabilityEditor';
import { LessonTracker } from '../components/LessonTracker';
import { platformService } from '../services/platformService';
import { cancellationMessage, isReschedulable } from '../lib/policy';
import type { Booking } from '../types';

const CURRICULUM = [
  { title: 'Cockpit drill & controls', duration: 2, status: 'done' },
  { title: 'Quiet streets, gear selection', duration: 4, status: 'done' },
  { title: 'Roundabouts & lane discipline', duration: 5, status: 'done' },
  { title: 'Parking — parallel, reverse, 3-point', duration: 6, status: 'current' },
  { title: 'Heavy traffic & merging', duration: 5, status: 'next' },
  { title: 'Test-route rehearsal', duration: 8, status: 'next' },
  { title: 'Mock driving test', duration: 2, status: 'next' },
];

const fldStyle: React.CSSProperties = {
  padding: '12px 14px',
  background: 'var(--paper-2)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  color: 'var(--ink)',
  width: '100%',
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sd-col sd-gap-2" style={{ flex: 1 }}>
      <span className="sd-eyebrow">{label}</span>
      {children}
    </div>
  );
}

export const Dashboard = () => {
  const { user, profile, initialize } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'lessons' | 'support'>('overview');
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setActiveTab('lessons');
      window.history.replaceState({}, '', '/dashboard');
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [suburb, setSuburb] = useState(profile?.learner_data?.[0]?.suburb || '');
  const [postcode, setPostcode] = useState(profile?.learner_data?.[0]?.postcode || '');
  const [licenseFrontUrl, setLicenseFrontUrl] = useState(profile?.learner_data?.[0]?.license_front_url || '');
  const [licenseBackUrl, setLicenseBackUrl] = useState(profile?.learner_data?.[0]?.license_back_url || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [suburbsCovered, setSuburbsCovered] = useState<string[]>(profile?.instructor_profiles?.[0]?.suburbs_covered || []);
  const [transmission, setTransmission] = useState<'Auto' | 'Manual'>(profile?.instructor_profiles?.[0]?.vehicle_transmission || 'Auto');
  const [hourlyRate, setHourlyRate] = useState<number>(profile?.instructor_profiles?.[0]?.hourly_rate || 75);
  const [newSuburb, setNewSuburb] = useState('');

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        contentType: file.type === 'application/octet-stream' ? `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` : file.type
      });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(publicUrl);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      await initialize();
    } catch (err: any) {
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await bookingService.getBookings(user.id);
      const sorted = data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      setBookings(sorted);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setSuburbsCovered(profile.instructor_profiles?.[0]?.suburbs_covered || []);
      setTransmission(profile.instructor_profiles?.[0]?.vehicle_transmission || 'Auto');
      setHourlyRate(profile.instructor_profiles?.[0]?.hourly_rate || 75);
      const ld = profile.learner_data?.[0] || profile.learner_data;
      if (ld) {
        setSuburb(ld.suburb || '');
        setPostcode(ld.postcode || '');
        setLicenseFrontUrl(ld.license_front_url || '');
        setLicenseBackUrl(ld.license_back_url || '');
      }
    }
  }, [profile]);

  const handleCancel = async (booking: Booking) => {
    const policy = cancellationMessage(booking.start_time);
    if (window.confirm(`Are you sure you want to cancel this lesson?\n\n${policy}`)) {
      try {
        await bookingService.cancelBooking(booking.id);
        fetchBookings();
      } catch { alert('Failed to cancel booking'); }
    }
  };

  const handleComplete = async (bookingId: string) => {
    if (window.confirm('Mark this lesson as completed? Your payout (minus platform fee) will be transferred to your Stripe account.')) {
      try {
        await platformService.completeLesson(bookingId);
        fetchBookings();
      } catch (err: any) { alert(err.message || 'Failed to complete lesson'); }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${side}-${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('learner-licenses').upload(fileName, file, {
        contentType: file.type === 'application/octet-stream' ? `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` : file.type
      });
      if (uploadError) throw uploadError;
      const { data: signedData } = await supabase.storage.from('learner-licenses').createSignedUrl(fileName, 3600);
      const displayUrl = signedData?.signedUrl || '';
      if (side === 'front') setLicenseFrontUrl(displayUrl);
      else setLicenseBackUrl(displayUrl);
      const { data: { publicUrl } } = supabase.storage.from('learner-licenses').getPublicUrl(fileName);
      const column = side === 'front' ? 'license_front_url' : 'license_back_url';
      const { error: updateError } = await supabase.from('learner_data').update({ [column]: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      await initialize();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', user.id);
      if (profileError) throw profileError;
      if (isInstructor) {
        const { error: instructorError } = await supabase.from('instructor_profiles').update({ suburbs_covered: suburbsCovered, vehicle_transmission: transmission, hourly_rate: hourlyRate }).eq('id', user.id);
        if (instructorError) throw instructorError;
      }
      if (profile?.role === 'learner') {
        const { error: learnerError } = await supabase.from('learner_data').update({ suburb, postcode, license_front_url: licenseFrontUrl, license_back_url: licenseBackUrl }).eq('id', user.id);
        if (learnerError) throw learnerError;
      }
      alert('Profile updated successfully!');
      await initialize();
    } catch (err: any) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--cobalt)' }}/>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && isFuture(parseISO(b.start_time)));
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed' || !isFuture(parseISO(b.start_time)));
  const isInstructor = profile?.role === 'instructor';
  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="sd-screen sd-container" style={{ padding: '40px 28px 80px' }}>
      {/* Header */}
      <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 32 }}>
        <div>
          <div className="sd-eyebrow" style={{ marginBottom: 8 }}>// Welcome back, {displayName}</div>
          <h1 className="sd-display" style={{ fontSize: 64, margin: 0, lineHeight: 1 }}>
            <em style={{ color: 'var(--cobalt)' }}>{upcomingBookings.length} lesson{upcomingBookings.length !== 1 ? 's' : ''}</em> upcoming.
          </h1>
        </div>
        <div className="sd-row sd-gap-2">
          <button onClick={() => setActiveTab('profile')} className="sd-btn sd-btn-ghost sd-btn-sm"><Icon name="settings" size={14}/> Settings</button>
          <Link to="/search" className="sd-btn sd-btn-cobalt sd-btn-sm" style={{ textDecoration: 'none' }}>Book another <Icon name="arrow" size={14}/></Link>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="sd-row sd-gap-1" style={{ borderBottom: '1px solid var(--line)', marginBottom: 28, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'lessons', label: isInstructor ? 'Student lessons' : 'My lessons' },
          { id: 'support', label: 'Help & support' },
          { id: 'profile', label: 'Profile & settings' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as 'overview' | 'profile' | 'lessons' | 'support')} style={{ padding: '12px 18px', border: 0, background: 'transparent', cursor: 'pointer', fontSize: 14, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? 'var(--ink)' : 'var(--ink-mute)', borderBottom: activeTab === t.id ? '2px solid var(--cobalt)' : '2px solid transparent', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {showSuccess && (
        <div style={{ marginBottom: 24, padding: '14px 20px', background: 'var(--lime)', border: '1px solid var(--ink)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="check" size={18}/>
          <div><div style={{ fontWeight: 700 }}>Payment Successful!</div><div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Your driving lesson has been booked and confirmed.</div></div>
          <button onClick={() => setShowSuccess(false)} style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer' }}><Icon name="close" size={16}/></button>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Top 3 cards */}
          <div className="sd-grid-3" style={{ alignItems: 'start', marginBottom: 28 }}>
            {/* Readiness card */}
            <div className="sd-card" style={{ padding: 24, background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' }}>
              <div className="sd-row sd-between sd-acenter">
                <div className="sd-eyebrow" style={{ color: 'var(--signal)' }}>// Test readiness</div>
                <span className="sd-chip sd-chip-signal" style={{ fontSize: 11 }}>76% ready</span>
              </div>
              <h2 className="sd-display" style={{ fontSize: 56, margin: '12px 0 4px', lineHeight: 1, color: 'var(--paper)' }}>76<span style={{ color: 'var(--ink-soft)' }}>/100</span></h2>
              <p className="sd-muted" style={{ color: 'var(--ink-soft)', fontSize: 13, marginBottom: 18 }}>Based on your last 4 lessons and 2 mock tests. Most learners book at 80+.</p>
              <div className="sd-col sd-gap-2">
                {[
                  { l: 'Vehicle control', v: 92 },
                  { l: 'Observations', v: 78 },
                  { l: 'Parking', v: 81 },
                  { l: 'Hazard response', v: 64 },
                  { l: 'Test-route familiarity', v: 65 },
                ].map((b, i) => (
                  <div key={i} className="sd-row sd-acenter sd-gap-3" style={{ fontSize: 12 }}>
                    <span style={{ width: 140, color: 'var(--ink-soft)' }}>{b.l}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 999 }}>
                      <div style={{ width: `${b.v}%`, height: '100%', background: b.v >= 80 ? 'var(--lime)' : b.v >= 70 ? 'var(--signal)' : 'var(--coral)', borderRadius: 999 }}/>
                    </div>
                    <span className="sd-mono" style={{ width: 28, textAlign: 'right', color: 'var(--paper)' }}>{b.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Logbook card — real completed lessons with NSW 3-for-1 credit */}
            {user && <LogbookCard learnerId={user.id} />}

            {/* Test date card */}
            <div className="sd-card" style={{ padding: 24, background: 'var(--signal)', border: '1px solid var(--ink)' }}>
              <div className="sd-eyebrow">// Test booked</div>
              <h2 className="sd-display" style={{ fontSize: 56, margin: '10px 0 0', lineHeight: 1 }}>Jun 04</h2>
              <div style={{ fontSize: 13, marginBottom: 18 }}>Rosebery RMS · 10:30 am</div>
              <div className="sd-col sd-gap-2" style={{ fontSize: 12 }}>
                <div className="sd-row sd-between"><span>Days to go</span><span className="sd-mono" style={{ fontWeight: 700 }}>23</span></div>
                <div className="sd-row sd-between"><span>Lessons booked</span><span className="sd-mono" style={{ fontWeight: 700 }}>{upcomingBookings.length}</span></div>
                <div className="sd-row sd-between"><span>Mock tests</span><span className="sd-mono" style={{ fontWeight: 700 }}>2 of 3</span></div>
              </div>
              <button onClick={() => navigate('/search')} className="sd-btn sd-btn-cobalt sd-btn-sm" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>Add test-route lessons</button>
            </div>
          </div>

          {/* Two columns */}
          <div className="sd-grid-3">
            <section style={{ gridColumn: 'span 2' }}>
              <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 14 }}>
                <h2 className="sd-display" style={{ fontSize: 32, margin: 0 }}>Upcoming lessons</h2>
                <button onClick={() => setActiveTab('lessons')} className="sd-btn sd-btn-ghost sd-btn-sm">View all <Icon name="arrow" size={13}/></button>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="sd-card" style={{ padding: 48, textAlign: 'center' }}>
                  <Icon name="calendar" size={36} style={{ color: 'var(--ink-soft)', display: 'block', margin: '0 auto 12px' }}/>
                  <p className="sd-muted" style={{ marginBottom: 16 }}>No upcoming lessons. Time to book one.</p>
                  <Link to="/search" className="sd-btn sd-btn-cobalt" style={{ textDecoration: 'none' }}>Find an instructor <Icon name="arrow" size={14}/></Link>
                </div>
              ) : (
                <div className="sd-col sd-gap-2">
                  {upcomingBookings.slice(0, 3).map((b, i) => (
                    <article key={b.id} className="sd-card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'auto 1fr auto' }}>
                      <div style={{ background: i === 0 ? 'var(--cobalt)' : 'var(--paper-2)', color: i === 0 ? '#fff' : 'var(--ink)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 100 }}>
                        <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .7 }}>{format(parseISO(b.start_time), 'MMM')}</div>
                        <div className="sd-display" style={{ fontSize: 44, lineHeight: 1, marginTop: 4 }}>{format(parseISO(b.start_time), 'd')}</div>
                        <div className="sd-mono" style={{ fontSize: 12, marginTop: 2 }}>{format(parseISO(b.start_time), 'h:mm a')}</div>
                      </div>
                      <div style={{ padding: 20 }}>
                        <div className="sd-row sd-acenter sd-gap-2" style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 16 }}>{b.user_is_learner ? `Lesson with ${b.other_party?.full_name || 'instructor'}` : `Student: ${b.other_party?.full_name || 'learner'}`}</span>
                          {b.status === 'confirmed' ? (
                            <span className="sd-chip sd-chip-lime" style={{ fontSize: 10 }}><Icon name="check" size={10}/> Confirmed</span>
                          ) : (
                            <span className="sd-chip sd-chip-signal" style={{ fontSize: 10 }}>Awaiting confirm</span>
                          )}
                        </div>
                        <div className="sd-row sd-gap-3 sd-muted" style={{ fontSize: 13 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={12}/> {b.pickup_address}</span>
                        </div>
                      </div>
                      <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isReschedulable(b.start_time) && (
                          <button onClick={() => setReschedulingBooking(b)} className="sd-btn sd-btn-ghost sd-btn-sm">Reschedule</button>
                        )}
                        <button onClick={() => handleCancel(b)} className="sd-btn sd-btn-ghost sd-btn-sm">Cancel</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Lesson plan */}
              <div className="sd-row sd-between sd-acenter" style={{ margin: '44px 0 14px' }}>
                <h2 className="sd-display" style={{ fontSize: 32, margin: 0 }}>My lesson plan</h2>
                <span className="sd-muted" style={{ fontSize: 12 }}>18/32 hrs</span>
              </div>
              <div className="sd-card" style={{ padding: 24 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 22, top: 4, bottom: 4, width: 4, background: 'var(--paper-2)', borderRadius: 2 }}/>
                  <div className="sd-col sd-gap-3">
                    {CURRICULUM.map((c, i) => (
                      <div key={i} className="sd-row sd-acenter sd-gap-3" style={{ position: 'relative' }}>
                        <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 999, background: c.status === 'done' ? 'var(--cobalt)' : c.status === 'current' ? 'var(--signal)' : 'var(--paper-2)', color: c.status === 'done' ? '#fff' : 'var(--ink)', border: '2px solid var(--surface)', boxShadow: c.status === 'current' ? '0 0 0 3px var(--signal)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, position: 'relative', zIndex: 1 }}>
                          {c.status === 'done' ? <Icon name="check" size={18}/> : i + 1}
                        </div>
                        <div className="sd-grow sd-row sd-between sd-acenter">
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{c.title}</div>
                            <div className="sd-muted" style={{ fontSize: 12 }}>{c.duration} hrs · {c.status === 'done' ? 'Done' : c.status === 'current' ? 'In progress' : 'Up next'}</div>
                          </div>
                          {c.status === 'current' && <span className="sd-chip sd-chip-signal" style={{ fontSize: 10 }}>Now</span>}
                          {c.status === 'next' && <span className="sd-chip sd-muted" style={{ fontSize: 10 }}>Locked</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Sidebar */}
            <aside className="sd-col sd-gap-4">
              {/* Hazard quiz */}
              <div className="sd-card" style={{ padding: 22, background: 'var(--cobalt-soft)', border: '1px solid var(--cobalt)' }}>
                <div className="sd-eyebrow" style={{ color: 'var(--cobalt-deep)' }}>// Daily practice</div>
                <h3 className="sd-display" style={{ fontSize: 24, margin: '6px 0', color: 'var(--cobalt-deep)' }}>Hazard quiz · 5 mins</h3>
                <p className="sd-muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 14, color: 'var(--ink-2)' }}>Your weakest skill is hazard response. 5 questions a day moves the needle fast.</p>
                <div className="sd-row sd-gap-2">
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= 4 ? 'var(--cobalt)' : 'rgba(0,0,0,.1)' }}/>
                  ))}
                </div>
                <div className="sd-row sd-between" style={{ marginTop: 8, fontSize: 11 }}>
                  <span className="sd-muted">4 day streak</span>
                  <span className="sd-mono" style={{ color: 'var(--cobalt-deep)', fontWeight: 700 }}>Start →</span>
                </div>
              </div>

              {/* Spending */}
              <div className="sd-card" style={{ padding: 22 }}>
                <div className="sd-row sd-between sd-acenter" style={{ marginBottom: 12 }}>
                  <h3 className="sd-display" style={{ fontSize: 22, margin: 0 }}>Spending</h3>
                  <span className="sd-chip" style={{ fontSize: 10 }}>This month</span>
                </div>
                <div className="sd-display" style={{ fontSize: 40, marginBottom: 6 }}>$702</div>
                <div className="sd-muted" style={{ fontSize: 12, marginBottom: 14 }}>9 lessons · avg $78/hr</div>
                <div className="sd-col sd-gap-2" style={{ fontSize: 12 }}>
                  {['Sat 10 May · $117 · 90 min', 'Wed 7 May · $78 · 60 min', 'Sat 3 May · $117 · 90 min'].map((r, i) => (
                    <div key={i} className="sd-row sd-between sd-muted" style={{ padding: '6px 0', borderTop: i === 0 ? 0 : '1px solid var(--line)' }}>
                      <span>{r.split('·')[0]}</span>
                      <span className="sd-mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.split('·')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* LESSONS TAB */}
      {activeTab === 'lessons' && (
        <div className="sd-col sd-gap-8">
          <section>
            <h2 className="sd-display" style={{ fontSize: 36, margin: '0 0 20px' }}>Upcoming lessons</h2>
            {upcomingBookings.length === 0 ? (
              <div className="sd-card" style={{ padding: 48, textAlign: 'center' }}>
                <Icon name="calendar" size={36} style={{ color: 'var(--ink-soft)', display: 'block', margin: '0 auto 12px' }}/>
                <p className="sd-muted" style={{ marginBottom: 16 }}>No upcoming lessons.</p>
                {!isInstructor && <Link to="/search" className="sd-btn sd-btn-cobalt" style={{ textDecoration: 'none' }}>Find an instructor <Icon name="arrow" size={14}/></Link>}
              </div>
            ) : (
              <div className="sd-col sd-gap-3">
                {upcomingBookings.map((b) => (
                  <article key={b.id} className="sd-card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'auto 1fr auto' }}>
                    <div style={{ background: 'var(--cobalt)', color: '#fff', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .7 }}>{format(parseISO(b.start_time), 'MMM')}</div>
                      <div className="sd-display" style={{ fontSize: 44, lineHeight: 1, marginTop: 4 }}>{format(parseISO(b.start_time), 'd')}</div>
                      <div className="sd-mono" style={{ fontSize: 12, marginTop: 2 }}>{format(parseISO(b.start_time), 'h:mm a')}</div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <div className="sd-row sd-acenter sd-gap-2" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{b.user_is_learner ? `Lesson with ${b.other_party?.full_name || 'instructor'}` : `Student: ${b.other_party?.full_name || 'learner'}`}</span>
                        {b.status === 'confirmed' ? (
                          <span className="sd-chip sd-chip-lime" style={{ fontSize: 10 }}><Icon name="check" size={10}/> Confirmed</span>
                        ) : (
                          <span className="sd-chip sd-chip-signal" style={{ fontSize: 10 }}>{b.status}</span>
                        )}
                      </div>
                      <div className="sd-row sd-gap-3 sd-muted" style={{ fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={12}/> {b.pickup_address}</span>
                      </div>
                    </div>
                    <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isReschedulable(b.start_time) && (
                        <button onClick={() => setReschedulingBooking(b)} className="sd-btn sd-btn-ghost sd-btn-sm">Reschedule</button>
                      )}
                      <button onClick={() => handleCancel(b)} className="sd-btn sd-btn-ghost sd-btn-sm" style={{ color: 'var(--coral)' }}>Cancel</button>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <LessonTracker booking={b} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {pastBookings.length > 0 && (
            <section>
              <h2 className="sd-display" style={{ fontSize: 36, margin: '0 0 20px' }}>History</h2>
              <div className="sd-card" style={{ padding: 0, overflow: 'hidden' }}>
                {pastBookings.map((b, i) => (
                  <div key={b.id} className="sd-row sd-between sd-acenter" style={{ padding: '16px 20px', borderTop: i === 0 ? 0 : '1px solid var(--line)' }}>
                    <div className="sd-row sd-acenter sd-gap-4">
                      <span className="sd-mono sd-muted" style={{ fontSize: 12, width: 100 }}>{format(parseISO(b.start_time), 'MMM d, yyyy')}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Driving Lesson</div>
                        <div className="sd-muted" style={{ fontSize: 12 }}>{b.other_party?.full_name}</div>
                      </div>
                    </div>
                    <div className="sd-row sd-acenter sd-gap-2">
                      {isInstructor && b.status === 'confirmed' && new Date(b.end_time) < new Date() && (
                        <button onClick={() => handleComplete(b.id)} className="sd-btn sd-btn-cobalt sd-btn-sm">Mark completed & get paid</button>
                      )}
                      <span className="sd-chip" style={{ fontSize: 11 }}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* SUPPORT TAB */}
      {activeTab === 'support' && <SupportPanel bookings={bookings} />}

      {/* Reschedule modal */}
      {reschedulingBooking && (
        <RescheduleModal
          booking={reschedulingBooking}
          onClose={() => setReschedulingBooking(null)}
          onRescheduled={fetchBookings}
        />
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: 860 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div className="sd-col sd-gap-6">
              {/* Avatar */}
              <div className="sd-card" style={{ padding: 24 }}>
                <div className="sd-eyebrow" style={{ marginBottom: 16 }}>// Profile photo</div>
                <div className="sd-row sd-acenter sd-gap-4">
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 999, overflow: 'hidden', background: 'var(--paper-2)', border: '3px solid var(--surface)', boxShadow: 'var(--shadow)' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--cobalt)' }}>
                          {fullName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <label style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: 'var(--cobalt)', color: '#fff', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
                      <Camera style={{ width: 12, height: 12 }}/>
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload}/>
                    </label>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{fullName || 'Your name'}</div>
                    <div className="sd-muted" style={{ fontSize: 13 }}>{user?.email}</div>
                    {saving && <div className="sd-muted" style={{ fontSize: 12, marginTop: 4 }}>Saving...</div>}
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="sd-card" style={{ padding: 24 }}>
                <div className="sd-eyebrow" style={{ marginBottom: 16 }}>// Personal details</div>
                <form onSubmit={handleSaveProfile} className="sd-col sd-gap-4">
                  <FormField label="Full name">
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={fldStyle} placeholder="e.g. Jane Smith"/>
                  </FormField>
                  <FormField label="Email address">
                    <input type="email" disabled value={user?.email || ''} style={{ ...fldStyle, background: 'var(--paper-2)', color: 'var(--ink-mute)', cursor: 'not-allowed' }}/>
                  </FormField>
                  {!isInstructor && (
                    <div className="sd-row sd-gap-3">
                      <FormField label="Suburb">
                        <input type="text" value={suburb} onChange={e => setSuburb(e.target.value)} style={fldStyle} placeholder="e.g. Richmond"/>
                      </FormField>
                      <FormField label="Postcode">
                        <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)} style={fldStyle} placeholder="3000"/>
                      </FormField>
                    </div>
                  )}
                  {isInstructor && (
                    <>
                      <FormField label="Transmission offered">
                        <select value={transmission} onChange={e => setTransmission(e.target.value as 'Auto' | 'Manual')} style={fldStyle}>
                          <option value="Auto">Automatic Only</option>
                          <option value="Manual">Manual Only</option>
                        </select>
                      </FormField>
                      <FormField label="Hourly rate ($)">
                        <input type="number" value={hourlyRate} onChange={e => setHourlyRate(parseInt(e.target.value) || 0)} style={fldStyle} placeholder="75"/>
                      </FormField>
                      <FormField label="Suburbs covered">
                        <div className="sd-row sd-gap-2" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                          {suburbsCovered.map((s, idx) => (
                            <span key={idx} className="sd-chip sd-chip-cobalt" style={{ cursor: 'pointer' }}>
                              {s}
                              <button type="button" onClick={() => setSuburbsCovered(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, marginLeft: 4, color: 'inherit' }}>×</button>
                            </span>
                          ))}
                        </div>
                        <div className="sd-row sd-gap-2">
                          <input type="text" value={newSuburb} onChange={e => setNewSuburb(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newSuburb.trim()) { setSuburbsCovered(prev => [...prev, newSuburb.trim()]); setNewSuburb(''); }}}} style={{ ...fldStyle, flex: 1 }} placeholder="Add a suburb..."/>
                          <button type="button" onClick={() => { if (newSuburb.trim()) { setSuburbsCovered(prev => [...prev, newSuburb.trim()]); setNewSuburb(''); }}} className="sd-btn sd-btn-outline sd-btn-sm">Add</button>
                        </div>
                      </FormField>
                    </>
                  )}
                  <button type="submit" disabled={saving} className="sd-btn sd-btn-cobalt" style={{ marginTop: 8 }}>
                    {saving && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}/>}
                    Save changes
                  </button>
                </form>
              </div>
            </div>

            <div className="sd-col sd-gap-4">
              {/* Verification status */}
              <div className="sd-card" style={{ padding: 22 }}>
                <div className="sd-eyebrow" style={{ marginBottom: 12 }}>// Verification status</div>
                <div className="sd-row sd-acenter sd-gap-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: profile?.learner_data?.[0]?.license_verified ? 'var(--lime)' : 'var(--signal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={profile?.learner_data?.[0]?.license_verified ? 'check' : 'lock'} size={20}/>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{profile?.learner_data?.[0]?.license_verified ? 'Verified Account' : 'Pending Verification'}</div>
                    <div className="sd-muted" style={{ fontSize: 12 }}>{profile?.learner_data?.[0]?.license_verified ? 'All documents approved.' : 'Upload your license to start booking.'}</div>
                  </div>
                </div>
              </div>

              {/* Stripe connect for instructors */}
              {isInstructor && !profile?.instructor_profiles?.[0]?.stripe_onboarding_complete && (
                <div className="sd-card" style={{ padding: 22, background: 'var(--cobalt-soft)', border: '1px solid var(--cobalt)' }}>
                  <div className="sd-eyebrow" style={{ color: 'var(--cobalt-deep)', marginBottom: 8 }}>// Connect Stripe</div>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 16 }}>Finish setting up your payouts to appear in search results.</p>
                  <button onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke('create-connect-account');
                      if (error) throw error;
                      if (data?.url) window.location.href = data.url;
                    } catch (err: any) { alert(err.message || 'Failed to initialize Stripe'); }
                  }} className="sd-btn sd-btn-cobalt" style={{ width: '100%', justifyContent: 'center' }}>
                    Complete onboarding <Icon name="arrow" size={14}/>
                  </button>
                </div>
              )}

              {/* License upload for learners */}
              {!isInstructor && (
                <div className="sd-card" style={{ padding: 22 }}>
                  <div className="sd-eyebrow" style={{ marginBottom: 12 }}>// Learner license</div>
                  {['front', 'back'].map((side) => {
                    const url = side === 'front' ? licenseFrontUrl : licenseBackUrl;
                    return (
                      <div key={side} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>License {side === 'front' ? 'Front' : 'Back'}</div>
                        <div style={{ position: 'relative', aspectRatio: '1.6/1', background: 'var(--paper-2)', borderRadius: 12, overflow: 'hidden', border: '1px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {url ? <img src={url} alt={`License ${side}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <div style={{ textAlign: 'center' }}><Camera style={{ width: 24, height: 24, color: 'var(--ink-soft)', display: 'block', margin: '0 auto 6px' }}/><span className="sd-muted" style={{ fontSize: 12 }}>Upload photo</span></div>}
                          <label style={{ position: 'absolute', inset: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,16,36,0.5)', opacity: 0, transition: 'opacity .2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}><Camera style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }}/>Change</span>
                            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => handleFileUpload(e, side as 'front' | 'back')}/>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Instructor booking calendar */}
          {isInstructor && user && (
            <div style={{ marginTop: 28 }}>
              <AvailabilityEditor instructorId={user.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
