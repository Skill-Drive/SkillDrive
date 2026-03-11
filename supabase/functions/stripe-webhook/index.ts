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
            const metadata = session.metadata;

            if (metadata && metadata.instructor_id) {
                const { error } = await supabaseClient
                    .from("bookings")
                    .insert({
                        instructor_id: metadata.instructor_id,
                        learner_id: metadata.learner_id,
                        start_time: metadata.start_time,
                        end_time: metadata.end_time,
                        pickup_address: metadata.pickup_address,
                        price: parseFloat(metadata.price),
                        status: "confirmed",
                        stripe_payment_intent: session.payment_intent,
                        stripe_session_id: session.id
                    });

                if (error) {
                    console.error("Error creating confirmed booking", error);
                } else {
                    // M5: Send email notifications
                    const { data: profiles } = await supabaseClient
                        .from('profiles')
                        .select('email, role')
                        .in('id', [metadata.instructor_id, metadata.learner_id]);

                    if (profiles) {
                        const learnerEmail = profiles.find(p => p.role === 'learner')?.email;
                        const instructorEmail = profiles.find(p => p.role === 'instructor')?.email;

                        // Using Resend for transactional emails (API key required in env)
                        const resendApiKey = Deno.env.get('RESEND_API_KEY');
                        if (resendApiKey && learnerEmail && instructorEmail) {
                            try {
                                await fetch('https://api.resend.com/emails', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${resendApiKey}`
                                    },
                                    body: JSON.stringify({
                                        from: 'SkillDrive <notifications@skilldrive.com.au>',
                                        to: [learnerEmail, instructorEmail],
                                        subject: 'SkillDrive Booking Confirmed',
                                        html: '<p>A new SkillDrive lesson has been confirmed!</p>'
                                    })
                                });
                            } catch (emailError) {
                                console.error('Failed to send confirmation email:', emailError);
                            }
                        } else {
                            console.log('Skipping emails: RESEND_API_KEY not set or missing emails.');
                        }
                    }
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
