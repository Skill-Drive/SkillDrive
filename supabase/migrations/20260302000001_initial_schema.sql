-- ============================================================
-- SkillDrive Initial Schema
-- ============================================================

-- Profiles table: mirrors auth.users for app-level user data
create table if not exists public.profiles (
  id        uuid        primary key references auth.users(id) on delete cascade,
  email     text        not null,
  full_name text        not null default '',
  role      text        not null default 'learner' check (role in ('learner', 'instructor')),
  avatar_url text,
  phone     text,
  created_at timestamptz not null default now()
);

-- Instructors table: extra data for users with role = 'instructor'
create table if not exists public.instructors (
  id                    uuid        primary key references public.profiles(id) on delete cascade,
  bio                   text        not null default '',
  suburbs_covered       text[]      not null default '{}',
  hourly_rate           numeric     not null default 75,
  rating                numeric     not null default 0,
  review_count          int         not null default 0,
  vehicle_model         text        not null default '',
  vehicle_year          int,
  vehicle_transmission  text        check (vehicle_transmission in ('Auto', 'Manual')),
  vehicle_image_url     text
);

-- Instructor weekly availability (optional — defaults to 9-5 if empty)
create table if not exists public.instructor_availability (
  id            uuid  primary key default gen_random_uuid(),
  instructor_id uuid  not null references public.instructors(id) on delete cascade,
  day_of_week   int   not null check (day_of_week between 0 and 6),
  start_time    time  not null,
  end_time      time  not null
);

-- Bookings table
create table if not exists public.bookings (
  id              uuid        primary key default gen_random_uuid(),
  instructor_id   uuid        not null references public.instructors(id) on delete restrict,
  learner_id      uuid        not null references public.profiles(id) on delete restrict,
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  status          text        not null default 'pending'
                              check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  pickup_address  text        not null,
  price           numeric     not null,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- Trigger: auto-create profile row on new auth user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'learner')
  );

  -- If the new user signed up as an instructor, also create their instructor row
  if coalesce(new.raw_user_meta_data->>'role', 'learner') = 'instructor' then
    insert into public.instructors (id)
    values (new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles              enable row level security;
alter table public.instructors           enable row level security;
alter table public.instructor_availability enable row level security;
alter table public.bookings              enable row level security;

-- Profiles: anyone can view; only own user can update
create policy "profiles_select"        on public.profiles for select using (true);
create policy "profiles_update_own"    on public.profiles for update using (auth.uid() = id);

-- Instructors: anyone can view; instructor can update their own row
create policy "instructors_select"     on public.instructors for select using (true);
create policy "instructors_update_own" on public.instructors for update using (auth.uid() = id);

-- Availability: viewable by all
create policy "availability_select"    on public.instructor_availability for select using (true);
create policy "availability_manage"    on public.instructor_availability for all using (auth.uid() = instructor_id);

-- Bookings: learner sees their own, instructor sees bookings for them
create policy "bookings_select" on public.bookings for select
  using (auth.uid() = learner_id or auth.uid() = instructor_id);

create policy "bookings_insert" on public.bookings for insert
  with check (auth.uid() = learner_id);

create policy "bookings_update" on public.bookings for update
  using (auth.uid() = learner_id or auth.uid() = instructor_id);
