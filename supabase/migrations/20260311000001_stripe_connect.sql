-- Add Stripe Connect fields to instructor_profiles
ALTER TABLE public.instructor_profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
