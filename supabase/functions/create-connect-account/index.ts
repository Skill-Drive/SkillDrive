import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

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
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
            authHeader.replace("Bearer ", "")
        );

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const { data: instructor } = await supabaseClient
            .from("instructor_profiles")
            .select("stripe_account_id")
            .eq("id", user.id)
            .single();

        if (!instructor) {
            throw new Error("Instructor profile not found.");
        }

        let accountId = instructor.stripe_account_id;

        if (!accountId) {
            // Create Stripe Connect Express account
            const account = await stripe.accounts.create({
                type: "express",
                email: user.email,
                country: "AU", // Enforce Australia
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });
            accountId = account.id;

            const { error: updateError } = await supabaseClient
                .from("instructor_profiles")
                .update({ stripe_account_id: accountId })
                .eq("id", user.id);

            if (updateError) throw updateError;
        }

        const { url } = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${req.headers.get("origin")}/dashboard?onboarding=refresh`,
            return_url: `${req.headers.get("origin")}/dashboard?onboarding=success`,
            type: "account_onboarding",
        });

        return new Response(JSON.stringify({ url }), {
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
