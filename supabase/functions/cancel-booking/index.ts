import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { sendEmail, templates } from "../_shared/email.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

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

    const { bookingId, reason } = await req.json();
    if (!bookingId) return errorResponse("Booking ID is required");

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, learner_id, instructor_id, stripe_payment_intent, status, start_time")
      .eq("id", bookingId)
      .single();
    if (fetchError || !booking) return errorResponse("Booking not found", 404);

    if (booking.learner_id !== user.id && booking.instructor_id !== user.id) {
      return errorResponse("You do not own this booking", 403);
    }
    if (booking.status === "cancelled") {
      return errorResponse("Booking is already cancelled");
    }
    if (booking.status === "completed") {
      return errorResponse("Completed lessons cannot be cancelled");
    }

    // Policy: full refund if cancelled >24h before start (learner) or if the
    // instructor cancels at any time. Inside the window a learner
    // cancellation forfeits the lesson fee.
    const msUntilLesson = new Date(booking.start_time).getTime() - Date.now();
    const cancelledByInstructor = booking.instructor_id === user.id;
    const refundable = cancelledByInstructor ||
      msUntilLesson > CANCELLATION_WINDOW_MS;

    let refundId: string | null = null;
    if (refundable && booking.status === "confirmed" && booking.stripe_payment_intent) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent,
        });
        refundId = refund.id;
      } catch (refundError: any) {
        console.error("Refund failed", refundError);
        return errorResponse(
          "Refund could not be processed automatically: " + refundError.message,
        );
      }
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason ?? null,
        stripe_refund_id: refundId,
      })
      .eq("id", bookingId);
    if (updateError) throw updateError;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("email")
      .in("id", [booking.instructor_id, booking.learner_id]);
    const emails = (profiles ?? []).map((p) => p.email).filter(Boolean);
    if (emails.length) {
      const tpl = templates.bookingCancelled(booking.start_time, !!refundId);
      await sendEmail({ to: emails, ...tpl });
    }

    return jsonResponse({ success: true, refunded: !!refundId });
  } catch (error: any) {
    return errorResponse(error.message ?? "Cancellation failed");
  }
});
