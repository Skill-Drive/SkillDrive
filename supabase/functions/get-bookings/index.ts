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
        const otherPartyIds = [...new Set((bookings || []).map((b: any) =>
            b.learner_id === user.id ? b.instructor_id : b.learner_id
        ))];

        let profilesMap: Record<string, any> = {};

        if (otherPartyIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabaseClient
                .from("profiles")
                .select("id, full_name, avatar_url, phone, role")
                .in("id", otherPartyIds);

            if (!profilesError && profiles) {
                profilesMap = profiles.reduce((acc, p) => {
                    acc[p.id] = p;
                    return acc;
                }, {} as Record<string, any>);
            }
        }

        const enhancedBookings = (bookings || []).map((booking: any) => {
            const isUserLearner = booking.learner_id === user.id;
            const otherPartyId = isUserLearner ? booking.instructor_id : booking.learner_id;
            const profile = profilesMap[otherPartyId];

            return {
                ...booking,
                other_party: profile || { full_name: "Unknown User" },
                user_is_learner: isUserLearner,
            };
        });

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
