import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Escrow model: the learner pays the platform account. Funds are only
// transferred to the instructor (minus commission) after the lesson is
// marked completed — see the `complete-lesson` function.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);
    const { data: { user }, error: userError } = await supabaseClient.auth
      .getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) return errorResponse("Unauthorized", 401);

    const { instructor_id, start_time, end_time, pickup_address, package_id } =
      await req.json();
    if (!instructor_id || !start_time || !end_time || !pickup_address) {
      return errorResponse("Missing required booking fields");
    }
    if (new Date(start_time) <= new Date()) {
      return errorResponse("Lesson start time must be in the future");
    }

    // Price is ALWAYS derived server-side from the instructor's rate or
    // the selected package — never trusted from the client.
    const { data: instructor, error: instructorError } = await supabaseClient
      .from("instructor_profiles")
      .select("hourly_rate, stripe_account_id, stripe_onboarding_complete, verification_status")
      .eq("id", instructor_id)
      .single();
    if (instructorError || !instructor) {
      return errorResponse("Instructor profile not found.");
    }
    if (instructor.verification_status === "suspended") {
      return errorResponse("This instructor is currently unavailable for bookings.");
    }
    if (!instructor.stripe_account_id || !instructor.stripe_onboarding_complete) {
      return errorResponse("Instructor has not completed Stripe onboarding.");
    }

    let productName = "SkillDrive Driving Lesson";
    let lessonType = "standard";
    let unitAmountCents: number;

    if (package_id) {
      const { data: pkg, error: pkgError } = await supabaseClient
        .from("instructor_packages")
        .select("*")
        .eq("id", package_id)
        .eq("instructor_id", instructor_id)
        .eq("active", true)
        .single();
      if (pkgError || !pkg) return errorResponse("Package not found or inactive.");
      productName = `SkillDrive — ${pkg.name}`;
      lessonType = pkg.package_type === "lesson_bundle" ? "standard" : pkg.package_type;
      unitAmountCents = pkg.price * 100;
    } else {
      const rate = instructor.hourly_rate;
      if (!rate || rate <= 0) {
        return errorResponse("Invalid instructor hourly rate configuration.");
      }
      const durationHours =
        (new Date(end_time).getTime() - new Date(start_time).getTime()) /
        3_600_000;
      if (durationHours <= 0 || durationHours > 4) {
        return errorResponse("Invalid lesson duration.");
      }
      unitAmountCents = Math.round(rate * 100 * durationHours);
    }

    // Instant booking: reject if the slot is already taken.
    const { data: clash } = await supabaseClient
      .from("bookings")
      .select("id")
      .eq("instructor_id", instructor_id)
      .in("status", ["pending", "confirmed"])
      .lt("start_time", end_time)
      .gt("end_time", start_time)
      .limit(1);
    if (clash && clash.length > 0) {
      return errorResponse("That time slot has just been booked. Please pick another.");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: productName,
              description: `Lesson on ${new Date(start_time).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}`,
            },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        instructor_id,
        learner_id: user.id,
        start_time,
        end_time,
        pickup_address,
        package_id: package_id ?? "",
        lesson_type: lessonType,
        price: (unitAmountCents / 100).toString(),
      },
      success_url: `${req.headers.get("origin")}/dashboard?success=true`,
      cancel_url: `${req.headers.get("origin")}/checkout?canceled=true`,
    });

    return jsonResponse({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    return errorResponse(error.message ?? "Checkout failed");
  }
});
