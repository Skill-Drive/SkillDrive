-- 1. Create learner_data table
CREATE TABLE IF NOT EXISTS public.learner_data (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  license_number TEXT,
  license_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on learner_data
ALTER TABLE public.learner_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners can view their own data" ON public.learner_data;
CREATE POLICY "Learners can view their own data" ON public.learner_data FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Learners can update their own data" ON public.learner_data;
CREATE POLICY "Learners can update their own data" ON public.learner_data FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Learners can insert their own data" ON public.learner_data;
CREATE POLICY "Learners can insert their own data" ON public.learner_data FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Update the existing on_auth_user_created trigger to also populate learner_data if role is learner
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', COALESCE(new.raw_app_meta_data->>'user_type', 'learner'))
  );
  
  IF COALESCE(new.raw_user_meta_data->>'role', COALESCE(new.raw_app_meta_data->>'user_type', 'learner')) = 'instructor' THEN
    INSERT INTO public.instructor_profiles (id) VALUES (new.id);
  ELSE
    INSERT INTO public.learner_data (id) VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Storage Buckets and RLS Policies for Licenses
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('instructor-licenses', 'instructor-licenses', false, 5242880, '{"image/jpeg","image/png","image/webp","application/pdf","application/octet-stream"}'),
  ('learner-licenses', 'learner-licenses', false, 5242880, '{"image/jpeg","image/png","image/webp","application/pdf","application/octet-stream"}')
ON CONFLICT (id) DO NOTHING;

-- RLS for instructor-licenses: Only the owner (auth.uid() = folder name) can access/insert
DROP POLICY IF EXISTS "Instructors can upload their own licenses" ON storage.objects;
CREATE POLICY "Instructors can upload their own licenses" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'instructor-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Instructors can select their own licenses" ON storage.objects;
CREATE POLICY "Instructors can select their own licenses" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'instructor-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Instructors can update their own licenses" ON storage.objects;
CREATE POLICY "Instructors can update their own licenses" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'instructor-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Instructors can delete their own licenses" ON storage.objects;
CREATE POLICY "Instructors can delete their own licenses" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'instructor-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS for learner-licenses
DROP POLICY IF EXISTS "Learners can upload their own licenses" ON storage.objects;
CREATE POLICY "Learners can upload their own licenses" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'learner-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Learners can select their own licenses" ON storage.objects;
CREATE POLICY "Learners can select their own licenses" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'learner-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Learners can update their own licenses" ON storage.objects;
CREATE POLICY "Learners can update their own licenses" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'learner-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Learners can delete their own licenses" ON storage.objects;
CREATE POLICY "Learners can delete their own licenses" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'learner-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Auth Hook: custom_access_token
-- This function injects the 'user_role' into the JWT claims based on the public.profiles role
CREATE OR REPLACE FUNCTION public.custom_access_token(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_type text;
BEGIN
  -- Fetch the user role from profiles table
  SELECT role INTO user_type FROM public.profiles WHERE id = (event->>'user_id')::uuid;
  
  -- If not found in profiles, check app_metadata
  IF user_type IS NULL THEN
    user_type := event->'request'->'app_metadata'->>'user_type';
  END IF;

  claims := event->'claims';
  
  IF user_type IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_type));
  END IF;

  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant permissions to supabase_auth_admin so GoTrue can execute the hook
REVOKE ALL ON FUNCTION public.custom_access_token(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.custom_access_token(jsonb) TO supabase_auth_admin;

-- 5. Index user_id and instructor_id columns to prevent sequential scans
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_id ON public.instructor_profiles(id);
CREATE INDEX IF NOT EXISTS idx_learner_data_id ON public.learner_data(id);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_id ON public.bookings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_learner_id ON public.bookings(learner_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_instructor_id ON public.availability_slots(instructor_id);
