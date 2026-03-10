import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

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

        // Fetch user bookings - user could be a learner OR an instructor
        const { data: bookings, error: bookingsError } = await supabaseClient
            .from("bookings")
            .select("*")
            .or(`learner_id.eq.${user.id},instructor_id.eq.${user.id}`)
            .order("start_time", { ascending: true });

        if (bookingsError) throw bookingsError;

        // Enhance bookings with the 'other' party's profile data
        const enhancedBookings = await Promise.all(
            (bookings || []).map(async (booking: any) => {
                const isUserLearner = booking.learner_id === user.id;
                const otherPartyId = isUserLearner ? booking.instructor_id : booking.learner_id;

                const { data: profile } = await supabaseClient
                    .from("profiles")
                    .select("full_name, avatar_url, phone, role")
                    .eq("id", otherPartyId)
                    .single();

                return {
                    ...booking,
                    other_party: profile || { full_name: "Unknown User" },
                    user_is_learner: isUserLearner,
                };
            })
        );

        return new Response(JSON.stringify({ bookings: enhancedBookings }), {
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
