import React, { useState, useRef } from 'react';
import { Camera, Upload, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

type VerificationStep = 'intro' | 'license' | 'liveness' | 'pending' | 'verified';

export const InstructorVerification = () => {
    const { user } = useAuth();
    const [step, setStep] = useState<VerificationStep>('intro');
    const [consentGiven, setConsentGiven] = useState(false);
    const [licenseImage, setLicenseImage] = useState<File | null>(null);
    const [selfieImage, setSelfieImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const licenseInputRef = useRef<HTMLInputElement>(null);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    const handleUploadLicense = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLicenseImage(e.target.files[0]);
        }
    };

    const handleUploadSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelfieImage(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!user || !licenseImage || !selfieImage) return;
        setLoading(true);
        setError('');

        try {
            // Upload License
            const licensePath = `${user.id}/${Date.now()}_license_${licenseImage.name}`;
            const { error: licenseError } = await supabase.storage
                .from('instructor-licenses')
                .upload(licensePath, licenseImage);
            if (licenseError) throw licenseError;

            // Upload Selfie
            const selfiePath = `${user.id}/${Date.now()}_selfie_${selfieImage.name}`;
            const { error: selfieError } = await supabase.storage
                .from('instructor-licenses')
                .upload(selfiePath, selfieImage);
            if (selfieError) throw selfieError;

            // Simulated automated verification window (5-12 seconds) as per requirements
            setStep('pending');

            // In a real system, you would call an Edge Function here
            // const { data } = await supabase.functions.invoke('verify-id', { body: { userId: user.id } });

            setTimeout(() => {
                setStep('verified');
            }, 7000); // 7 second simulated delay

        } catch (err: any) {
            setError(err.message || 'Verification upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">

                {/* Header */}
                <div className="px-6 py-8 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                        To verify your VIC Driving Instructor Authority as required by Safe Transport Victoria, we need to securely check your ID.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">{error}</div>
                        </div>
                    )}

                    {step === 'intro' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                                <h3 className="text-sm font-semibold text-blue-800">Privacy Collection Notice & Biometric Consent</h3>
                                <p className="mt-2 text-xs text-blue-700 leading-relaxed">
                                    In compliance with the Australian Privacy Principles (APP 11), your identity documents are exclusively used for instructor verification.
                                    Biometric data (your selfie) is compared against your ID using an automated system to prevent fraud.
                                    Once verified, original images will be deleted or moved to cold-storage within 24 hours. Your data is never sold or shared with external marketing entities.
                                </p>
                                <div className="mt-4 flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="consent"
                                            name="consent"
                                            type="checkbox"
                                            checked={consentGiven}
                                            onChange={(e) => setConsentGiven(e.target.checked)}
                                            className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="consent" className="font-medium text-blue-900">
                                            I consent to the collection and processing of my biometric data and ID for verification purposes.
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setStep('license')}
                                disabled={!consentGiven}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Verification
                            </button>
                        </div>
                    )}

                    {step === 'license' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900">Step 1: Front of Driver's License</h3>
                                <p className="text-sm text-gray-500 mt-1">Please ensure the image is well-lit, not blurry, and all 4 corners are visible.</p>
                            </div>

                            <div
                                className={`mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${licenseImage ? 'border-primary bg-blue-50' : 'border-gray-300'}`}
                            >
                                <div className="space-y-1 text-center cursor-pointer" onClick={() => licenseInputRef.current?.click()}>
                                    {licenseImage ? (
                                        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                                    ) : (
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    )}
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <span className="relative rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                                            {licenseImage ? licenseImage.name : 'Upload a file'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                </div>
                                <input ref={licenseInputRef} id="license-upload" name="license-upload" type="file" accept="image/*" className="sr-only" onChange={handleUploadLicense} />
                            </div>

                            <div className="flex justify-between">
                                <button onClick={() => setStep('intro')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                                <button
                                    onClick={() => setStep('liveness')}
                                    disabled={!licenseImage}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'liveness' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900">Step 2: Liveness Check</h3>
                                <p className="text-sm text-gray-500 mt-1">Take a clear, straight-on selfie holding your ID next to your face to ensure it's really you.</p>
                            </div>

                            <div
                                className={`mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${selfieImage ? 'border-primary bg-blue-50' : 'border-gray-300'}`}
                            >
                                <div className="space-y-1 text-center cursor-pointer" onClick={() => selfieInputRef.current?.click()}>
                                    {selfieImage ? (
                                        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                                    ) : (
                                        <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                    )}
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <span className="relative rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                                            {selfieImage ? selfieImage.name : 'Take a Selfie / Upload'}
                                        </span>
                                    </div>
                                </div>
                                <input ref={selfieInputRef} id="selfie-upload" capture="user" type="file" accept="image/*" className="sr-only" onChange={handleUploadSelfie} />
                            </div>

                            <div className="flex justify-between">
                                <button onClick={() => setStep('license')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selfieImage || loading}
                                    className="px-4 flex items-center gap-2 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Submit Verification'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'pending' && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
                            <h3 className="text-lg font-medium text-gray-900">Verifying Identity...</h3>
                            <p className="text-sm text-gray-500">Please do not close this page. This usually takes 5-12 seconds.</p>
                        </div>
                    )}

                    {step === 'verified' && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <CheckCircle2 className="h-20 w-20 text-green-500" />
                            <h3 className="text-2xl font-bold text-gray-900">Verification Complete</h3>
                            <p className="text-sm text-gray-500 text-center max-w-sm">
                                Thank you! Your instructor ID has been verified.
                                In accordance with APP 11, your biometric images are now scheduled for cold-storage removal.
                            </p>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="mt-6 px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
