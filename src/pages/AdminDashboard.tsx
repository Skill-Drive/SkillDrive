import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

// In a real application, you would fetch this from a secure view or table
// where users have uploaded their licenses but aren't verified yet.
export const AdminDashboard = () => {
    const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // For demonstration, let's assume we fetch basic profiles who need verification.
        // In production, this would query a specific `instructor_verifications` table
        const fetchPending = async () => {
            setLoading(true);
            try {
                // Mock query - fetch profiles where role is instructor
                // We'd ideally join with app_metadata or another table for 'id_verified = false'
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'instructor')
                    .limit(10);

                if (error) throw error;
                // In this demo, we'll just show the fetched instructors
                setPendingVerifications(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPending();
    }, []);

    const handleVerify = async (userId: string) => {
        try {
            // Typically, an admin verifies the sighting, which triggers the edge function
            const { error } = await supabase.functions.invoke('verify-id', {
                body: { userId, action: 'verify' }
            });
            if (error) throw error;

            // Remove from list
            setPendingVerifications((prev) => prev.filter((u) => u.id !== userId));
            alert('Instructor verified. Biometric data securely purged.');
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="h-8 w-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Sighting & Verification Dashboard</h1>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start hidden">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div className="ml-3 text-sm">{error}</div>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="px-6 py-4 text-center text-sm text-gray-500">Loading pending verifications...</li>
                    ) : pendingVerifications.length === 0 ? (
                        <li className="px-6 py-4 text-center text-sm text-gray-500">No pending verifications.</li>
                    ) : (
                        pendingVerifications.map((user) => (
                            <li key={user.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{user.full_name}</h3>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <p className="text-xs text-indigo-600 mt-1">Status: Pending Verification</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => handleVerify(user.id)}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Verify & Purge UI
                                    </button>
                                    <button
                                        onClick={() => alert('Verification rejected')}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                    >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};
