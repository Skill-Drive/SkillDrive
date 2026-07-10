import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { sendEmail, templates } from "../_shared/email.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Platform commission taken from each lesson before the payout transfer.
const COMMISSION_RATE = 0.15;

// Escrow release: the instructor marks the lesson completed, the platform
// keeps its commission and transfers the remainder to the instructor's
// Stripe Connect account.
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

    const { bookingId } = await req.json();
    if (!bookingId) return errorResponse("Booking ID is required");

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, instructor_id, learner_id, status, start_time, end_time, price, stripe_payment_intent, payout_transfer_id")
      .eq("id", bookingId)
      .single();
    if (fetchError || !booking) return errorResponse("Booking not found", 404);

    if (booking.instructor_id !== user.id) {
      return errorResponse("Only the instructor can complete a lesson", 403);
    }
    if (booking.status !== "confirmed") {
      return errorResponse(`Cannot complete a booking with status '${booking.status}'`);
    }
    if (new Date(booking.end_time) > new Date()) {
      return errorResponse("The lesson has not finished yet");
    }
    if (booking.payout_transfer_id) {
      return errorResponse("This lesson has already been paid out");
    }

    const { data: instructor } = await supabase
      .from("instructor_profiles")
      .select("stripe_account_id")
      .eq("id", booking.instructor_id)
      .single();
    if (!instructor?.stripe_account_id) {
      return errorResponse("Instructor Stripe account not found");
    }

    const totalCents = Math.round(Number(booking.price) * 100);
    const payoutCents = totalCents - Math.round(totalCents * COMMISSION_RATE);

    let transferId: string | null = null;
    if (booking.stripe_payment_intent) {
      const transfer = await stripe.transfers.create({
        amount: payoutCents,
        currency: "aud",
        destination: instructor.stripe_account_id,
        transfer_group: `booking_${booking.id}`,
        metadata: { booking_id: booking.id },
      });
      transferId = transfer.id;
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        payout_transfer_id: transferId,
        payout_amount: payoutCents,
      })
      .eq("id", bookingId);
    if (updateError) throw updateError;

    const { data: instructorProfile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", booking.instructor_id)
      .single();
    if (instructorProfile?.email && transferId) {
      const tpl = templates.payoutSent(payoutCents, booking.start_time);
      await sendEmail({ to: instructorProfile.email, ...tpl });
    }

    return jsonResponse({
      success: true,
      payout_amount: payoutCents,
      transfer_id: transferId,
    });
  } catch (error: any) {
    return errorResponse(error.message ?? "Completion failed");
  }
});
