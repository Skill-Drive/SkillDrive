import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { sendEmail, templates } from "../_shared/email.ts";

// Invoked on a schedule (e.g. Supabase cron every hour). Sends 24-hour
// reminders for lessons starting between 24h and 25h from now.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Guard: only the service role key (or scheduled invocation) may run this.
    const authHeader = req.headers.get("Authorization") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!authHeader.includes(serviceKey)) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceKey,
    );

    const windowStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const windowEnd = new Date(Date.now() + 25 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, learner_id, instructor_id, start_time, pickup_address")
      .eq("status", "confirmed")
      .gte("start_time", windowStart.toISOString())
      .lt("start_time", windowEnd.toISOString());
    if (error) throw error;

    let sent = 0;
    for (const booking of bookings ?? []) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", [booking.learner_id, booking.instructor_id]);

      const learner = profiles?.find((p) => p.id === booking.learner_id);
      const instructor = profiles?.find((p) => p.id === booking.instructor_id);

      if (learner?.email) {
        const tpl = templates.lessonReminder(
          booking.start_time,
          booking.pickup_address,
          instructor?.full_name ?? "your instructor",
        );
        if (await sendEmail({ to: learner.email, ...tpl })) sent++;
      }
      if (instructor?.email) {
        const tpl = templates.lessonReminder(
          booking.start_time,
          booking.pickup_address,
          learner?.full_name ?? "your learner",
        );
        if (await sendEmail({ to: instructor.email, ...tpl })) sent++;
      }
    }

    return jsonResponse({ processed: bookings?.length ?? 0, emails_sent: sent });
  } catch (error: any) {
    return errorResponse(error.message ?? "Reminder run failed");
  }
});
