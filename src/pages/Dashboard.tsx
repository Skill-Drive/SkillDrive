import React, { useEffect, useState } from 'react';
import { format, parseISO, isFuture } from 'date-fns';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, User, BookOpen, Loader2, Camera, MapPinned } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { Booking } from '../types';

export const Dashboard = () => {
  const { user, profile, initialize } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'lessons'>('profile');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form state
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
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

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
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Update local state when profile changes (e.g. after initial load)
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

  const handleCancel = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this lesson?')) {
      try {
        await bookingService.cancelBooking(bookingId);
        fetchBookings();
      } catch (error) {
        alert('Failed to cancel booking');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${side}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('learner-licenses')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('learner-licenses')
        .getPublicUrl(filePath);

      if (side === 'front') {
        setLicenseFrontUrl(publicUrl);
      } else {
        setLicenseBackUrl(publicUrl);
      }

      // Immediately partial update learner_data
      const column = side === 'front' ? 'license_front_url' : 'license_back_url';
      const { error: updateError } = await supabase
        .from('learner_data')
        .update({ [column]: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh global state
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
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update instructor_profiles table
      if (isInstructor) {
        const { error: instructorError } = await supabase
          .from('instructor_profiles')
          .update({
            suburbs_covered: suburbsCovered,
            vehicle_transmission: transmission,
            hourly_rate: hourlyRate
          })
          .eq('id', user.id);

        if (instructorError) throw instructorError;
      }

      // Update learner_data table
      if (profile?.role === 'learner') {
        const { error: learnerError } = await supabase
          .from('learner_data')
          .update({
            suburb,
            postcode,
            license_front_url: licenseFrontUrl,
            license_back_url: licenseBackUrl
          })
          .eq('id', user.id);

        if (learnerError) throw learnerError;
      }

      alert('Profile updated successfully!');
      await initialize(); // Refresh global auth state
    } catch (err: any) {
      alert('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const icon: Record<string, React.JSX.Element> = {
      pending: <Clock className="w-3 h-3" />,
      confirmed: <CheckCircle className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${styles[status]}`}>
        {icon[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && isFuture(parseISO(b.start_time)));
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed' || !isFuture(parseISO(b.start_time)));

  const isInstructor = profile?.role === 'instructor';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header with Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[80px] z-40">
        <div className="container-main">
          <div className="pt-8 pb-0">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {isInstructor ? 'Instructor Account' : 'My Account'}
                </h1>
                <p className="text-gray-500 mt-1">
                  Manage your profile details and lesson schedule.
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                <User className="h-4 w-4" />
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'lessons' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
              >
                <BookOpen className="h-4 w-4" />
                {isInstructor ? 'Student Lessons' : 'My Lessons'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main mt-10">
        {activeTab === 'profile' ? (
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Basic Info */}
              <div className="lg:col-span-2">
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    Personal Details
                  </h2>

                  {/* Avatar Section */}
                  <div className="flex flex-col items-center mb-10">
                    <div className="relative group">
                      <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary/10">
                            <span className="text-4xl font-black text-primary">
                              {fullName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition-all transform hover:scale-110">
                        <Camera className="h-5 w-5" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-4">Profile Photo</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-primary focus:border-primary"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="mt-1 block w-full border border-gray-100 rounded-lg p-3 shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-400 italic">Email cannot be changed manually.</p>
                      </div>

                      {!isInstructor && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Suburb</label>
                            <div className="relative mt-1">
                              <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                value={suburb}
                                onChange={(e) => setSuburb(e.target.value)}
                                className="block w-full border border-gray-300 rounded-lg pl-10 p-3 shadow-sm focus:ring-primary focus:border-primary"
                                placeholder="e.g. Richmond"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Postcode</label>
                            <input
                              type="text"
                              value={postcode}
                              onChange={(e) => setPostcode(e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-primary focus:border-primary"
                              placeholder="3000"
                            />
                          </div>
                        </div>
                      )}

                      {isInstructor && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Suburbs Covered (Service Areas)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {suburbsCovered.map((s, idx) => (
                                <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold animate-in fade-in zoom-in duration-200">
                                  {s}
                                  <button
                                    type="button"
                                    onClick={() => setSuburbsCovered(prev => prev.filter((_, i) => i !== idx))}
                                    className="hover:text-red-500 transition-colors"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newSuburb}
                                onChange={(e) => setNewSuburb(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (newSuburb.trim()) {
                                      setSuburbsCovered(prev => [...prev, newSuburb.trim()]);
                                      setNewSuburb('');
                                    }
                                  }
                                }}
                                className="flex-grow border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-primary focus:border-primary"
                                placeholder="Add a suburb..."
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newSuburb.trim()) {
                                    setSuburbsCovered(prev => [...prev, newSuburb.trim()]);
                                    setNewSuburb('');
                                  }
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 rounded-lg transition-colors border border-gray-200"
                              >
                                Add
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-400">List the areas where you provide driving lessons.</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Transmission Offered</label>
                              <select
                                value={transmission}
                                onChange={(e) => setTransmission(e.target.value as 'Auto' | 'Manual')}
                                className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-primary focus:border-primary"
                              >
                                <option value="Auto">Automatic Only</option>
                                <option value="Manual">Manual Only</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                              <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input
                                  type="number"
                                  value={hourlyRate}
                                  onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                                  className="block w-full border border-gray-300 rounded-lg pl-8 p-3 shadow-sm focus:ring-primary focus:border-primary"
                                  placeholder="75"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </section>

                {!isInstructor && (
                  <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      Learner Identity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Front of License */}
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Driver License (Front)</label>
                        <div className="relative group aspect-[1.6/1] w-full rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          {licenseFrontUrl ? (
                            <img src={licenseFrontUrl} alt="License Front" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Upload clean photo</p>
                            </div>
                          )}
                          <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-bold flex items-center gap-2">
                              <Camera className="h-4 w-4" /> Change Photo
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'front')} />
                          </label>
                        </div>
                      </div>

                      {/* Back of License */}
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Driver License (Back)</label>
                        <div className="relative group aspect-[1.6/1] w-full rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          {licenseBackUrl ? (
                            <img src={licenseBackUrl} alt="License Back" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Upload clean photo</p>
                            </div>
                          )}
                          <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-bold flex items-center gap-2">
                              <Camera className="h-4 w-4" /> Change Photo
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'back')} />
                          </label>
                        </div>
                      </div>
                    </div>
                    <p className="mt-6 text-sm text-gray-500 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      High resolution photos help us verify your identity faster.
                    </p>
                  </section>
                )}
              </div>

              {/* Right Column: Status Summary */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4">Verification Status</h3>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${profile?.learner_data?.[0]?.license_verified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {profile?.learner_data?.[0]?.license_verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {profile?.learner_data?.[0]?.license_verified ? 'Verified Account' : 'Pending Verification'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {profile?.learner_data?.[0]?.license_verified
                          ? 'All documents are approved.'
                          : 'Upload your license to start booking lessons.'}
                      </p>
                    </div>
                  </div>
                </div>

                {isInstructor && !profile?.instructor_profiles?.[0]?.stripe_onboarding_complete && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
                    <h3 className="font-bold text-blue-900 mb-2">Connect Stripe</h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Finish setting up your payouts to start appearing in search results.
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('create-connect-account');
                          if (error) throw error;
                          if (data?.url) window.location.href = data.url;
                        } catch (err: any) {
                          alert(err.message || 'Failed to initialize Stripe');
                        }
                      }}
                      className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-blue-700 transition-colors"
                    >
                      Complete Onboarding
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Lessons */}
            <section>
              <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Upcoming Schedule
              </h2>

              {upcomingBookings.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-4">You have no lessons coming up.</p>
                  {!isInstructor && (
                    <a href="/search" className="btn-primary inline-flex items-center gap-2">
                      Book an Instructor
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingBookings.map(booking => {
                    const otherPartyName = booking.other_party?.full_name || 'User';
                    const isLearner = booking.user_is_learner;
                    const title = isLearner ? `Lesson with ${otherPartyName}` : `Student: ${otherPartyName}`;

                    return (
                      <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-6">
                        <div className="bg-blue-50 p-4 rounded-xl text-center min-w-[90px] h-fit">
                          <span className="block text-xs font-bold text-blue-600 uppercase">{format(parseISO(booking.start_time), 'MMM')}</span>
                          <span className="block text-2xl font-black text-gray-900">{format(parseISO(booking.start_time), 'd')}</span>
                        </div>

                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900">{title}</h3>
                            <StatusBadge status={booking.status} />
                          </div>
                          <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {format(parseISO(booking.start_time), 'h:mm a')}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {booking.pickup_address}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-xs text-red-600 hover:bg-red-50 font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                          >
                            Cancel Lesson
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Past Lessons */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  History
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  {pastBookings.map(booking => (
                    <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-xs font-bold text-gray-400 w-24">
                          {format(parseISO(booking.start_time), 'MMM d, yyyy')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Driving Lesson</p>
                          <p className="text-xs text-gray-500">{booking.other_party?.full_name}</p>
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};