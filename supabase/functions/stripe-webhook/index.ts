import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { sendEmail, templates } from "../_shared/email.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (request) => {
  const signature = request.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response("No signature found", { status: 400 });
  }

  const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;
  const body = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret,
      undefined,
      cryptoProvider,
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const metadata = session.metadata;
      if (!metadata?.instructor_id) break;

      // Unique index on stripe_session_id makes retried webhooks a no-op.
      const { error } = await supabase.from("bookings").insert({
        instructor_id: metadata.instructor_id,
        learner_id: metadata.learner_id,
        start_time: metadata.start_time,
        end_time: metadata.end_time,
        pickup_address: metadata.pickup_address,
        price: parseFloat(metadata.price),
        lesson_type: metadata.lesson_type || "standard",
        package_id: metadata.package_id || null,
        duration_minutes: Math.round(
          (new Date(metadata.end_time).getTime() -
            new Date(metadata.start_time).getTime()) / 60000,
        ),
        status: "confirmed",
        stripe_payment_intent: session.payment_intent,
        stripe_session_id: session.id,
      });

      if (error) {
        if (error.code === "23505") {
          console.log("Duplicate webhook delivery ignored:", session.id);
          break;
        }
        console.error("Error creating confirmed booking", error);
        // Non-2xx so Stripe retries — payment succeeded, booking must exist.
        return new Response("Booking insert failed", { status: 500 });
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", [metadata.instructor_id, metadata.learner_id]);
      const emails = (profiles ?? []).map((p) => p.email).filter(Boolean);
      if (emails.length) {
        const tpl = templates.bookingConfirmed(
          metadata.start_time,
          metadata.pickup_address,
          parseFloat(metadata.price),
        );
        await sendEmail({ to: emails, ...tpl });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as any;
      if (!charge.payment_intent) break;
      await supabase
        .from("bookings")
        .update({ stripe_refund_id: charge.refunds?.data?.[0]?.id ?? "refunded" })
        .eq("stripe_payment_intent", charge.payment_intent);
      break;
    }

    case "account.updated": {
      const account = event.data.object as any;
      // Require full onboarding, not just details_submitted.
      const complete = account.details_submitted &&
        account.charges_enabled !== false;
      const { error } = await supabase
        .from("instructor_profiles")
        .update({ stripe_onboarding_complete: complete })
        .eq("stripe_account_id", account.id);
      if (error) {
        console.error("Error updating instructor onboarding status", error);
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
