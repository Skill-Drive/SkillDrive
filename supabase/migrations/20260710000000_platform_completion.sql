-- ============================================================
-- SkillDrive Platform Completion
-- Adds: reviews, instructor packages, telemetry, support tickets,
-- audit logs, NSW compliance fields, logbook (3-for-1) views,
-- privilege-escalation guard, and booking lifecycle fields.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Cleanup: drop unused duplicate tables from the second
--    "initial schema" migration. Canonical tables are
--    instructor_profiles / availability_slots / bookings.
-- ------------------------------------------------------------
DROP TABLE IF EXISTS public.instructor_availability CASCADE;
DROP TABLE IF EXISTS public.instructors CASCADE;

-- ------------------------------------------------------------
-- 1. Privilege escalation guard
--    Users must never be able to change their own role via the
--    "update own profile" RLS policy. Only admins (or the
--    service role, where auth.uid() is NULL) may change roles.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You are not allowed to change your role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_escalation();

-- ------------------------------------------------------------
-- 2. NSW compliance fields on instructor_profiles
-- ------------------------------------------------------------
ALTER TABLE public.instructor_profiles
  ALTER COLUMN state SET DEFAULT 'NSW';

ALTER TABLE public.instructor_profiles
  ADD COLUMN IF NOT EXISTS di_licence_expiry DATE,
  ADD COLUMN IF NOT EXISTS wwcc_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS vehicle_registration VARCHAR(20),
  ADD COLUMN IF NOT EXISTS vehicle_registration_expiry DATE,
  ADD COLUMN IF NOT EXISTS dual_control BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS postcodes_covered TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

COMMENT ON COLUMN public.instructor_profiles.dia_number IS 'NSW Driving Instructor Licence number';
COMMENT ON COLUMN public.instructor_profiles.di_licence_expiry IS 'Expiry date of the NSW Driving Instructor Licence';
COMMENT ON COLUMN public.instructor_profiles.wwcc_number IS 'Working With Children Check clearance number';
COMMENT ON COLUMN public.instructor_profiles.dual_control IS 'Vehicle is fitted with dual controls';

DO $$
BEGIN
  ALTER TABLE public.instructor_profiles DROP CONSTRAINT IF EXISTS instructor_profiles_verification_status_check;
  ALTER TABLE public.instructor_profiles
    ADD CONSTRAINT instructor_profiles_verification_status_check
    CHECK (verification_status IN ('pending', 'approved', 'suspended', 'rejected'));
END $$;

-- Auto-suspend instructors whose compliance documents have expired.
-- Intended to run daily via pg_cron (scheduled below when available).
CREATE OR REPLACE FUNCTION public.suspend_expired_instructor_documents()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspended_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.instructor_profiles ip
    SET verification_status = 'suspended',
        suspended_at = NOW(),
        suspension_reason = CONCAT_WS('; ',
          CASE WHEN ip.di_licence_expiry < CURRENT_DATE THEN 'Driving Instructor Licence expired' END,
          CASE WHEN ip.wwcc_expiry < CURRENT_DATE THEN 'WWCC expired' END,
          CASE WHEN ip.vehicle_registration_expiry < CURRENT_DATE THEN 'Vehicle registration expired' END
        )
    WHERE ip.verification_status = 'approved'
      AND (
        ip.di_licence_expiry < CURRENT_DATE
        OR ip.wwcc_expiry < CURRENT_DATE
        OR ip.vehicle_registration_expiry < CURRENT_DATE
      )
    RETURNING ip.id
  )
  SELECT COUNT(*) INTO suspended_count FROM expired;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, details)
  SELECT NULL, 'auto_suspend_expired_documents', 'instructor_profiles',
         jsonb_build_object('suspended_count', suspended_count)
  WHERE suspended_count > 0;

  RETURN suspended_count;
END;
$$;

-- ------------------------------------------------------------
-- 3. Booking lifecycle fields (cancellation / refunds / payouts)
-- ------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS lesson_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (lesson_type IN ('standard', 'test_package', 'intl_conversion')),
  ADD COLUMN IF NOT EXISTS package_id UUID,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_amount INTEGER,
  ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMPTZ;

-- Idempotency for the Stripe webhook (one booking per checkout session)
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_stripe_session
  ON public.bookings (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON public.bookings (start_time);

-- ------------------------------------------------------------
-- 4. Instructor packages (test packages, intl conversions, bundles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  package_type TEXT NOT NULL DEFAULT 'test_package'
    CHECK (package_type IN ('test_package', 'intl_conversion', 'lesson_bundle')),
  price INTEGER NOT NULL CHECK (price > 0), -- dollars AUD
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  includes_car_for_test BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.instructor_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_public_select" ON public.instructor_packages
  FOR SELECT USING (active = TRUE OR auth.uid() = instructor_id OR public.is_admin());
CREATE POLICY "packages_instructor_insert" ON public.instructor_packages
  FOR INSERT WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "packages_instructor_update" ON public.instructor_packages
  FOR UPDATE USING (auth.uid() = instructor_id OR public.is_admin());
CREATE POLICY "packages_instructor_delete" ON public.instructor_packages
  FOR DELETE USING (auth.uid() = instructor_id OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_packages_instructor ON public.instructor_packages (instructor_id);

ALTER TABLE public.bookings
  ADD CONSTRAINT fk_bookings_package
  FOREIGN KEY (package_id) REFERENCES public.instructor_packages(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 5. Reviews & ratings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_select" ON public.reviews FOR SELECT USING (TRUE);
-- Learners may only review their own completed bookings
CREATE POLICY "reviews_learner_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = learner_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.learner_id = auth.uid()
        AND b.instructor_id = reviews.instructor_id
        AND b.status = 'completed'
    )
  );
CREATE POLICY "reviews_admin_delete" ON public.reviews FOR DELETE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_reviews_instructor ON public.reviews (instructor_id);

-- Keep the aggregate rating on instructor_profiles in sync
CREATE OR REPLACE FUNCTION public.refresh_instructor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target UUID := COALESCE(NEW.instructor_id, OLD.instructor_id);
BEGIN
  UPDATE public.instructor_profiles ip
  SET rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.instructor_id = target), 0),
      review_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.instructor_id = target)
  WHERE ip.id = target;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_instructor_rating ON public.reviews;
CREATE TRIGGER trg_refresh_instructor_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.refresh_instructor_rating();

-- ------------------------------------------------------------
-- 6. Lesson telemetry ("flight log" of the lesson route)
--    High-frequency JSON point arrays: [{lat, lng, t, speed}]
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lesson_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  points JSONB NOT NULL DEFAULT '[]'::jsonb,
  distance_km NUMERIC(8, 2),
  max_speed_kmh NUMERIC(6, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lesson_telemetry ENABLE ROW LEVEL SECURITY;

-- Both lesson participants (and admins) can view the log post-lesson
CREATE POLICY "telemetry_participants_select" ON public.lesson_telemetry
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.learner_id = auth.uid() OR b.instructor_id = auth.uid())
    )
  );
-- Only a participant of the booking can start a log, as themselves
CREATE POLICY "telemetry_participants_insert" ON public.lesson_telemetry
  FOR INSERT WITH CHECK (
    auth.uid() = recorded_by
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.learner_id = auth.uid() OR b.instructor_id = auth.uid())
    )
  );
-- Only the device that started the recording can append points / finish it
CREATE POLICY "telemetry_recorder_update" ON public.lesson_telemetry
  FOR UPDATE USING (auth.uid() = recorded_by AND status = 'recording');

CREATE INDEX IF NOT EXISTS idx_telemetry_booking ON public.lesson_telemetry (booking_id);

-- ------------------------------------------------------------
-- 7. Support tickets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('dispute', 'technical', 'billing', 'safety', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_own_select" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "tickets_own_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_admin_update" ON public.support_tickets
  FOR UPDATE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets (status);

-- ------------------------------------------------------------
-- 8. Audit logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Read-only for admins; rows are written exclusively by triggers /
-- security-definer functions / the service role. No user policies.
CREATE POLICY "audit_admin_select" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs (entity_type, entity_id);

-- Trigger: log sensitive changes with the auth.uid() of the actor
CREATE OR REPLACE FUNCTION public.log_sensitive_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'instructor_profiles' THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
      VALUES (auth.uid(), 'instructor_verification_status_changed', 'instructor_profiles', NEW.id,
              jsonb_build_object('from', OLD.verification_status, 'to', NEW.verification_status));
    END IF;
    IF NEW.id_verified IS DISTINCT FROM OLD.id_verified THEN
      INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
      VALUES (auth.uid(), CASE WHEN NEW.id_verified THEN 'instructor_document_approved' ELSE 'instructor_document_revoked' END,
              'instructor_profiles', NEW.id, '{}'::jsonb);
    END IF;
  ELSIF TG_TABLE_NAME = 'bookings' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
      VALUES (auth.uid(), 'booking_status_changed', 'bookings', NEW.id,
              jsonb_build_object('from', OLD.status, 'to', NEW.status,
                                 'refund_id', NEW.stripe_refund_id,
                                 'payout_transfer_id', NEW.payout_transfer_id));
    END IF;
  ELSIF TG_TABLE_NAME = 'support_tickets' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, details)
      VALUES (auth.uid(), 'support_ticket_status_changed', 'support_tickets', NEW.id,
              jsonb_build_object('from', OLD.status, 'to', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_instructor_profiles ON public.instructor_profiles;
CREATE TRIGGER trg_audit_instructor_profiles
  AFTER UPDATE ON public.instructor_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.log_sensitive_change();

DROP TRIGGER IF EXISTS trg_audit_bookings ON public.bookings;
CREATE TRIGGER trg_audit_bookings
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.log_sensitive_change();

DROP TRIGGER IF EXISTS trg_audit_support_tickets ON public.support_tickets;
CREATE TRIGGER trg_audit_support_tickets
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.log_sensitive_change();

-- ------------------------------------------------------------
-- 9. NSW logbook (3-for-1 rule)
--    1 hour of structured instruction = 3 logbook hours, for the
--    learner's first 10 lessons only (Road Users' Handbook rule).
--    security_invoker so the caller's bookings RLS applies.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.learner_logbook
WITH (security_invoker = true)
AS
WITH completed AS (
  SELECT b.id AS booking_id,
         b.learner_id,
         b.instructor_id,
         b.start_time,
         b.end_time,
         ROUND((EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0)::numeric, 2) AS actual_hours,
         ROW_NUMBER() OVER (PARTITION BY b.learner_id ORDER BY b.start_time) AS lesson_number
  FROM public.bookings b
  WHERE b.status = 'completed'
)
SELECT c.*,
       (c.lesson_number <= 10) AS bonus_applied,
       CASE WHEN c.lesson_number <= 10 THEN ROUND(c.actual_hours * 3, 2) ELSE c.actual_hours END AS credited_hours,
       p.full_name AS instructor_name
FROM completed c
LEFT JOIN public.profiles p ON p.id = c.instructor_id;

-- ------------------------------------------------------------
-- 10. Availability slots hardening
-- ------------------------------------------------------------
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
BEGIN
  ALTER TABLE public.availability_slots
    ADD CONSTRAINT uq_availability_slot UNIQUE (instructor_id, day_of_week, start_time);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

-- Slots must be well-formed
DO $$
BEGIN
  ALTER TABLE public.availability_slots
    ADD CONSTRAINT chk_availability_times CHECK (end_time > start_time);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 11. Admin visibility for new tables + tickets/telemetry updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_tickets ON public.support_tickets;
CREATE TRIGGER trg_touch_tickets BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_telemetry ON public.lesson_telemetry;
CREATE TRIGGER trg_touch_telemetry BEFORE UPDATE ON public.lesson_telemetry
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- ------------------------------------------------------------
-- 12. Schedule daily compliance sweep when pg_cron is installed
--     (safe no-op on local stacks without the extension)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'suspend-expired-instructor-documents',
      '0 16 * * *', -- 02:00 AEST
      $cron$ SELECT public.suspend_expired_instructor_documents(); $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END $$;
