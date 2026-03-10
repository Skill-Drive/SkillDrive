-- Get a fixed UUID for our mock auth user (instructor)
-- Note: inserting directly into auth.users is complex securely, 
-- but for local testing, Supabase init provides a way, or we can just mock the profile if RLS permits.
-- Actually, inserting into auth.users requires specific fields for Supabase Postgres.
-- To bypass, we can just insert into profiles and instructor_profiles. The profiles table has an FK to auth.users, 
-- so we might need a dummy auth user, or remove the FK for the seed, or use a known auth.users ID if available.
-- A simpler approach for the seed is to temporarily disable the FK or just insert an auth user.
-- Let's insert a dummy user into auth.users

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES 
('d11b32d2-069e-4e68-9a67-c102324dc801', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'instructor@skilldrive.com', 'password', NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Wilson","role":"instructor"}', NOW(), NOW(), '', '', '', '')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES ('d11b32d2-069e-4e68-9a67-c102324dc801', 'instructor@skilldrive.com', 'Sarah Wilson', 'instructor', '0400000000')
ON CONFLICT (id) DO UPDATE SET role = 'instructor';

INSERT INTO public.instructor_profiles (id, bio, suburbs_covered, vehicle_model, vehicle_year, vehicle_transmission, vehicle_image_url, hourly_rate, rating, review_count)
VALUES (
  'd11b32d2-069e-4e68-9a67-c102324dc801',
  'Patient and experienced instructor with 10+ years of experience. I specialize in nervous learners and defensive driving techniques.',
  ARRAY['Surry Hills', 'Redfern', 'Waterloo', 'Zetland'],
  'Toyota Corolla Hybrid',
  2023,
  'Auto',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
  75,
  4.9,
  124
) ON CONFLICT (id) DO NOTHING;

-- Insert some availability slots (Monday to Friday, 9am to 5pm)
INSERT INTO public.availability_slots (instructor_id, day_of_week, start_time, end_time)
VALUES 
  ('d11b32d2-069e-4e68-9a67-c102324dc801', 1, '09:00:00', '17:00:00'),
  ('d11b32d2-069e-4e68-9a67-c102324dc801', 2, '09:00:00', '17:00:00'),
  ('d11b32d2-069e-4e68-9a67-c102324dc801', 3, '09:00:00', '17:00:00'),
  ('d11b32d2-069e-4e68-9a67-c102324dc801', 4, '09:00:00', '17:00:00'),
  ('d11b32d2-069e-4e68-9a67-c102324dc801', 5, '09:00:00', '17:00:00')
ON CONFLICT DO NOTHING;
