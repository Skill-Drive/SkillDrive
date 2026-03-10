import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Loader2, ShieldCheck } from 'lucide-react';

export const SetupInstructorPassword = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Parse the hash fragment from the URL that Supabase sends in the invite email
        // Format is usually #access_token=...&refresh_token=...&type=invite
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const refreshToken = params.get('refresh_token');
            const accessToken = params.get('access_token');
            const type = params.get('type');

            if (type === 'invite' && refreshToken && accessToken) {
                // Set the session using the tokens
                supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                }).catch(err => {
                    setError('Invalid or expired invitation link. ' + err.message);
                });
            } else {
                setError('Invalid invitation link parameters.');
            }
        } else {
            setError('No invitation tokens found in URL.');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check if we actually have a session first
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("You must be authenticated via the invite link to set a password.");
            }

            // Update the user's password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            // Password is set, send them to onboarding flow
            navigate('/instructor-onboarding');

        } catch (err: any) {
            setError(err.message || 'Failed to securely set password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-green-600 p-3 rounded-xl">
                        <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Set Instructor Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Welcome to SkillDrive. Secure your instructor account to proceed with state boarding.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error ? (
                        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md text-center">
                            {error}
                            <div className="mt-4">
                                <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">Return to Login</button>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New Strong Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        placeholder="Min 8 characters"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Set Password & Continue'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
