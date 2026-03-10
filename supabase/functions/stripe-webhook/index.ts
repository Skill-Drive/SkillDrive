import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

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
            cryptoProvider
        );
    } catch (err: any) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;
            const bookingId = session.client_reference_id;

            if (bookingId) {
                const { error } = await supabaseClient
                    .from("bookings")
                    .update({
                        status: "confirmed",
                        stripe_payment_intent: session.payment_intent,
                    })
                    .eq("id", bookingId);

                if (error) {
                    console.error("Error updating booking", error);
                }
            }
            break;
        }
        case "account.updated": {
            const account = event.data.object as any;
            if (account.details_submitted) {
                const { error } = await supabaseClient
                    .from("instructor_profiles")
                    .update({ stripe_onboarding_complete: true })
                    .eq("stripe_account_id", account.id);
                if (error) {
                    console.error("Error updating instructor onboarding status", error);
                }
            }
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
});
