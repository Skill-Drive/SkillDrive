-- 1. Update the profiles role constraint
-- First, identify the constraint name. Usually it's profiles_role_check
DO $$ 
BEGIN 
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('learner', 'instructor', 'admin'));
END $$;

-- 2. Update the custom_access_token hook to ensure it handles any role correctly
-- (It already fetches from public.profiles, so it should work for 'admin' automatically)

-- 3. Add a helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin View Policies (Example: Admins can view all learner data)
-- Since RLS is enabled, we need to allow admins to see everything.
CREATE POLICY "Admins can view all learner data" ON public.learner_data FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view all instructor profiles" ON public.instructor_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- 5. Admin Update Policies (Example: Admins can update roles)
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can update any instructor profile" ON public.instructor_profiles FOR UPDATE USING (public.is_admin());
