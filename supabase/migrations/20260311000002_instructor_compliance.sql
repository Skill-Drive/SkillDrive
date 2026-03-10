-- Add state compliance and onboarding credentials to instructor_profiles
ALTER TABLE public.instructor_profiles
ADD COLUMN IF NOT EXISTS state VARCHAR(10) DEFAULT 'VIC',
ADD COLUMN IF NOT EXISTS dia_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS state_license_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS certificate_iv_status BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wwcc_status VARCHAR(100),
ADD COLUMN IF NOT EXISTS wwcc_expiry DATE,
ADD COLUMN IF NOT EXISTS insurance_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';

-- Move the 'app_custom_state' from generic profiles to specialized instructor_profiles where it belongs
-- We will rely on instructor_profiles for these details rather than polluting the global auth profile
