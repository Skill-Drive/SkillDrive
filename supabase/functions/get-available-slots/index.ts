import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { setHours, setMinutes, isSameDay } from "npm:date-fns@2.30.0"; // Requires deno npm: specifier

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

        const { instructorId, dateIso } = await req.json();
        if (!instructorId || !dateIso) throw new Error("instructorId and dateIso are required");

        const queryId = instructorId === "1" ? "d11b32d2-069e-4e68-9a67-c102324dc801" : instructorId;
        const requestedDate = new Date(dateIso);

        const { data: bookings, error } = await supabaseClient
            .from("bookings")
            .select("*")
            .eq("instructor_id", queryId)
            .neq("status", "cancelled");

        if (error) throw error;

        const slots: string[] = []; // return ISO strings back to client
        const startHour = 9;
        const endHour = 17;

        for (let i = startHour; i < endHour; i++) {
            const slot = setMinutes(setHours(requestedDate, i), 0);

            if (slot < new Date()) continue;

            const isBooked = bookings?.some((booking: any) => {
                const bookingStart = new Date(booking.start_time);
                return isSameDay(bookingStart, requestedDate) && bookingStart.getHours() === i;
            });

            if (!isBooked) {
                slots.push(slot.toISOString());
            }
        }

        return new Response(JSON.stringify({ slots }), {
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
