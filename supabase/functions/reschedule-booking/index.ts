import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { sendEmail, templates } from "../_shared/email.ts";

const RESCHEDULE_WINDOW_MS = 24 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !user) return errorResponse("Unauthorized", 401);

    const { bookingId, newStartTime } = await req.json();
    if (!bookingId || !newStartTime) {
      return errorResponse("bookingId and newStartTime are required");
    }

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, learner_id, instructor_id, status, start_time, end_time, duration_minutes")
      .eq("id", bookingId)
      .single();
    if (fetchError || !booking) return errorResponse("Booking not found", 404);

    if (booking.learner_id !== user.id && booking.instructor_id !== user.id) {
      return errorResponse("You do not own this booking", 403);
    }
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      return errorResponse("Only upcoming lessons can be rescheduled");
    }
    if (new Date(booking.start_time).getTime() - Date.now() < RESCHEDULE_WINDOW_MS) {
      return errorResponse(
        "Lessons can only be rescheduled up to 24 hours before the start time",
      );
    }

    const newStart = new Date(newStartTime);
    if (isNaN(newStart.getTime()) || newStart <= new Date()) {
      return errorResponse("New start time must be a valid future time");
    }
    const durationMs = (booking.duration_minutes ?? 60) * 60000;
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Prevent double-booking the instructor at the new time.
    const { data: clash } = await supabase
      .from("bookings")
      .select("id")
      .eq("instructor_id", booking.instructor_id)
      .neq("id", booking.id)
      .in("status", ["pending", "confirmed"])
      .lt("start_time", newEnd.toISOString())
      .gt("end_time", newStart.toISOString())
      .limit(1);
    if (clash && clash.length > 0) {
      return errorResponse("The instructor is not available at that time.");
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        rescheduled_from: booking.start_time,
      })
      .eq("id", bookingId);
    if (updateError) throw updateError;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("email")
      .in("id", [booking.instructor_id, booking.learner_id]);
    const emails = (profiles ?? []).map((p) => p.email).filter(Boolean);
    if (emails.length) {
      const tpl = templates.bookingRescheduled(
        booking.start_time,
        newStart.toISOString(),
      );
      await sendEmail({ to: emails, ...tpl });
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message ?? "Reschedule failed");
  }
});
