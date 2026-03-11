import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
});


const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        const authHeader = req.headers.get("Authorization")!;
        if (!authHeader) throw new Error("Missing Authorization header");

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
            authHeader.replace("Bearer ", "")
        );

        if (userError || !user) throw new Error("Unauthorized");

        const { bookingId } = await req.json();
        if (!bookingId) throw new Error("Booking ID is required");

        // Important: users can only cancel bookings they are a part of.
        const { data: booking, error: fetchError } = await supabaseClient
            .from("bookings")
            .select("id, learner_id, instructor_id, stripe_payment_intent, status")
            .eq("id", bookingId)
            .single();

        if (fetchError || !booking) throw new Error("Booking not found");

        if (booking.learner_id !== user.id && booking.instructor_id !== user.id) {
            throw new Error("Unauthorized: You do not own this booking");
        }

        if (booking.status === "confirmed" && booking.stripe_payment_intent) {
            try {
                await stripe.refunds.create({ payment_intent: booking.stripe_payment_intent });
            } catch (refundError: any) {
                console.error("Refund failed", refundError);
                throw new Error("Refund could not be processed automatically: " + refundError.message);
            }
        }

        const { error: updateError } = await supabaseClient
            .from("bookings")
            .update({ status: "cancelled" })
            .eq("id", bookingId);

        if (updateError) throw updateError;

        // M5: Send email notifications
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('email, role')
            .in('id', [booking.instructor_id, booking.learner_id]);

        if (profiles) {
            const learnerEmail = profiles.find(p => p.role === 'learner')?.email;
            const instructorEmail = profiles.find(p => p.role === 'instructor')?.email;

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
                            subject: 'SkillDrive Booking Cancelled',
                            html: '<p>A SkillDrive lesson has been cancelled.</p>'
                        })
                    });
                } catch (emailError) {
                    console.error('Failed to send cancellation email:', emailError);
                }
            } else {
                console.log('Skipping emails: RESEND_API_KEY not set or missing emails.');
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
