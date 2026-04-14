-- Add verification fields to instructor_profiles
ALTER TABLE public.instructor_profiles 
ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS license_front_url TEXT,
ADD COLUMN IF NOT EXISTS license_back_url TEXT;

COMMENT ON COLUMN public.instructor_profiles.id_verified IS 'True if the instructor ID has been manually verified by an admin';
COMMENT ON COLUMN public.instructor_profiles.license_front_url IS 'Storage URL for the front of the driving instructor license image';
COMMENT ON COLUMN public.instructor_profiles.license_back_url IS 'Storage URL for the back of the driving instructor license image or selfie';
