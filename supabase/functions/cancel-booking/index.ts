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

        const { bookingId } = await req.json();
        if (!bookingId) throw new Error("Booking ID is required");

        // Important: users can only cancel bookings they are a part of.
        const { data: booking, error: fetchError } = await supabaseClient
            .from("bookings")
            .select("id, learner_id, instructor_id")
            .eq("id", bookingId)
            .single();

        if (fetchError || !booking) throw new Error("Booking not found");

        if (booking.learner_id !== user.id && booking.instructor_id !== user.id) {
            throw new Error("Unauthorized: You do not own this booking");
        }

        const { error: updateError } = await supabaseClient
            .from("bookings")
            .update({ status: "cancelled" })
            .eq("id", bookingId);

        if (updateError) throw updateError;

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
