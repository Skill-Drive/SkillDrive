import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { GraduationCap, DollarSign, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export const Teach = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // For the sake of this demo, we allow self-invitation via the Edge Function
            // In a strict production environment, this might just save a lead to a database for admin review
            const { error: functionError } = await supabase.functions.invoke('invite-instructor', {
                body: { email }
            });

            if (functionError) throw functionError;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative bg-blue-900">
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2940"
                        alt="Driving Instructor"
                        className="w-full h-full object-cover opacity-20"
                    />
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="md:w-2/3 lg:w-1/2">
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Teach with SkillDrive
                        </h1>
                        <p className="mt-6 text-xl text-blue-100 max-w-3xl">
                            Turn your driving expertise into a thriving business. Set your own hours, reach more learners, and get paid securely with our platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* Application Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Benefits */}
                    <div className="space-y-10">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Why instruct with us?</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Guaranteed Payouts</h3>
                                <p className="mt-2 text-gray-600">Enjoy seamless Stripe payouts straight to your bank account. We handle the GST and tax invoices automatically.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <ShieldCheck className="h-8 w-8 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Verified Learners</h3>
                                <p className="mt-2 text-gray-600">All learners have verified identities, ensuring a safe and professional environment for every lesson.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <GraduationCap className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">State Compliant</h3>
                                <p className="mt-2 text-gray-600">Our platform seamlessly integrates with AU state regulations, managing your WWCC and DIA checks securely.</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-gray-50 rounded-2xl p-8 shadow-lg border border-gray-100">
                        {success ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Invitation Sent!</h3>
                                <p className="text-gray-600">
                                    We've sent an exclusive invitation to <strong>{email}</strong>.
                                    Please check your inbox to set your secure password and complete your state onboarding credentials.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Apply to become an Instructor</h3>

                                {error && (
                                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleApply} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Request Invitation'}
                                    </button>
                                    <p className="text-xs text-gray-500 text-center mt-4">
                                        By applying, you consent to background checks and verification of your professional driving credentials as required by state law.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
