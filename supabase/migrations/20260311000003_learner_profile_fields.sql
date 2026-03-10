-- Add profile fields to learner_data
ALTER TABLE public.learner_data 
ADD COLUMN IF NOT EXISTS suburb TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS license_front_url TEXT,
ADD COLUMN IF NOT EXISTS license_back_url TEXT;

-- Ensure RLS is updated if needed (though existing policies on learner_data should cover simple column additions)
-- Existing policies are:
-- CREATE POLICY "Learners can view their own data" ON public.learner_data FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Learners can update their own data" ON public.learner_data FOR UPDATE USING (auth.uid() = id);

COMMENT ON COLUMN public.learner_data.license_front_url IS 'Storage URL for the front of the learner driver license image';
COMMENT ON COLUMN public.learner_data.license_back_url IS 'Storage URL for the back of the learner driver license image';
