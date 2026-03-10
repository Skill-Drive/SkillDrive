-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'instructor')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create instructor_profiles table
CREATE TABLE public.instructor_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  suburbs_covered TEXT[] DEFAULT '{}',
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_transmission TEXT CHECK (vehicle_transmission IN ('Auto', 'Manual')),
  vehicle_image_url TEXT,
  hourly_rate INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructor_profiles(id) ON DELETE CASCADE NOT NULL,
  learner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  pickup_address TEXT NOT NULL,
  price INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create availability_slots table
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructor_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Instructor Profiles Policies
CREATE POLICY "Instructor profiles are viewable by everyone" ON public.instructor_profiles FOR SELECT USING (true);
CREATE POLICY "Instructors can insert their own profile" ON public.instructor_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Instructors can update their own profile" ON public.instructor_profiles FOR UPDATE USING (auth.uid() = id);

-- Bookings Policies
CREATE POLICY "Learners and instructors can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = learner_id OR auth.uid() = instructor_id);
CREATE POLICY "Learners can insert a booking" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Participants can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = learner_id OR auth.uid() = instructor_id);

-- Availability Slots Policies
CREATE POLICY "Availability slots are viewable by everyone" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "Instructors can manage their own availability" ON public.availability_slots FOR ALL USING (auth.uid() = instructor_id);

-- Function to handle new user registration triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'learner')
  );
  
  IF COALESCE(new.raw_user_meta_data->>'role', 'learner') = 'instructor' THEN
    INSERT INTO public.instructor_profiles (id) VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
