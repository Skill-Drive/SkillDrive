import { useState } from 'react';

import { supabase } from '../services/supabase';
import { FileText, Loader2, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AU_STATES = [
    { code: 'VIC', name: 'Victoria' },
    { code: 'NSW', name: 'New South Wales' },
    { code: 'ACT', name: 'Australian Capital Territory' },
    // Simplified for demo, add QLD, WA, etc. in prod
];

export const InstructorOnboarding = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [state, setState] = useState('VIC');
    // Global requirement
    const [wwccNumber, setWwccNumber] = useState('');
    const [wwccExpiry, setWwccExpiry] = useState('');

    // VIC specifics
    const [diaNumber, setDiaNumber] = useState('');
    const [certIVStatus, setCertIVStatus] = useState(false);

    // NSW specifics
    const [nswLicenseNumber, setNswLicenseNumber] = useState('');
    const [nswRecordKeepAck, setNswRecordKeepAck] = useState(false);

    // ACT specifics
    const [actInsuranceAck, setActInsuranceAck] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!user) {
            setError('User session not found.');
            setLoading(false);
            return;
        }

        // Validate basic
        if (!wwccNumber || !wwccExpiry) {
            setError('Working With Children Check details are strictly required.');
            setLoading(false);
            return;
        }

        // Validate States
        if (state === 'VIC' && (!diaNumber || !certIVStatus)) {
            setError('Victoria requires a DIA number and Certificate IV confirmation.');
            setLoading(false);
            return;
        }
        if (state === 'NSW' && (!nswLicenseNumber || !nswRecordKeepAck)) {
            setError('NSW requires an Instructor License Number and explicit record-keeping acknowledgement.');
            setLoading(false);
            return;
        }
        if (state === 'ACT' && !actInsuranceAck) {
            setError('ACT requires explicit acknowledgement of $5M minimum Public Liability Insurance.');
            setLoading(false);
            return;
        }

        try {
            // Update profile with state-specific data
            const { error: dbError } = await supabase
                .from('instructor_profiles')
                .update({
                    state,
                    wwcc_status: wwccNumber,
                    wwcc_expiry: wwccExpiry,
                    dia_number: state === 'VIC' ? diaNumber : null,
                    certificate_iv_status: state === 'VIC' ? certIVStatus : false,
                    state_license_number: state === 'NSW' ? nswLicenseNumber : null,
                    insurance_certificate_url: state === 'ACT' ? (actInsuranceAck ? 'acknowledged' : null) : null,
                    verification_status: 'pending_onboarding_details'
                })
                .eq('id', user.id);

            if (dbError) throw dbError;

            // Immediately redirect to Stripe Onboarding after credentials
            const { data, error: functionError } = await supabase.functions.invoke('create-connect-account');

            if (functionError) throw functionError;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('Failed to generate secure Stripe onboarding link.');
            }

        } catch (err: any) {
            setError(err.message || 'Failed to submit onboarding credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="flex justify-center mb-4">
                    <div className="bg-primary p-3 rounded-xl border-4 border-white shadow-sm">
                        <FileText className="h-8 w-8 text-white" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Professional Credentials
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 px-6">
                    To comply with Australian state regulations and ensure learner safety, please provide your mandatory driving instructor credentials.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {/* UNIVERSAL REQUIREMENTS */}
                        <div className="space-y-4 pb-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                Learner Safety (Universal)
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">WWCC / Blue Card Number</label>
                                <input
                                    type="text"
                                    required
                                    value={wwccNumber}
                                    onChange={(e) => setWwccNumber(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                <input
                                    type="date"
                                    required
                                    value={wwccExpiry}
                                    onChange={(e) => setWwccExpiry(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        {/* STATE SELECTION */}
                        <div className="pb-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-primary" />
                                State Registration
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Operating State</label>
                                <select
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                                >
                                    {AU_STATES.map(s => (
                                        <option key={s.code} value={s.code}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* STATE SPECIFIC RENDER */}
                        <div className="space-y-4 pb-6">
                            {state === 'VIC' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
                                        Data shared dynamically with Commercial Passenger Vehicles Victoria (CPVV).
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">DIA Number</label>
                                        <input
                                            type="text"
                                            required={state === 'VIC'}
                                            value={diaNumber}
                                            onChange={(e) => setDiaNumber(e.target.value)}
                                            placeholder="e.g. D123456"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                    <div className="flex items-start mt-4">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={certIVStatus}
                                                onChange={(e) => setCertIVStatus(e.target.checked)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label className="font-medium text-gray-700">Certificate IV (TLI41222) Holder</label>
                                            <p className="text-gray-500">I declare I currently hold a valid Certificate IV in Motor Vehicle Driving Instruction.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {state === 'NSW' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
                                        Data compliance checked against Service NSW.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">NSW Instructor License Number</label>
                                        <input
                                            type="text"
                                            required={state === 'NSW'}
                                            value={nswLicenseNumber}
                                            onChange={(e) => setNswLicenseNumber(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                    </div>
                                    <div className="flex items-start mt-4">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={nswRecordKeepAck}
                                                onChange={(e) => setNswRecordKeepAck(e.target.checked)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label className="font-medium text-gray-700">Road Transport (Driver Licensing) Regulation 2017</label>
                                            <p className="text-gray-500">I acknowledge my legal obligation to securely maintain student records for precisely five (5) years.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {state === 'ACT' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                                        ACT mandates high-coverage public liability explicitly.
                                    </div>
                                    <div className="flex items-start mt-4">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                checked={actInsuranceAck}
                                                onChange={(e) => setActInsuranceAck(e.target.checked)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label className="font-medium text-gray-700">Public Liability $5M Minimum</label>
                                            <p className="text-gray-500">I certify I hold Public Liability Insurance covering a minimum of $5,000,000 AUD, and will provide the Certificate of Currency upon Admin request.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Credentials & Setup Payouts'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
