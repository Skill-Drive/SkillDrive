import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Get optional search parameters from the request logic.
        // If we wanted to search by postcode, we would do it here. 
        // Currently, we'll just return all instructors for the demo, 
        // but structure it so we *could* filter later.
        const { postcode, filters } = await req.json().catch(() => ({}));

        let query = supabaseClient
            .from("profiles")
            .select("*, instructor_profiles(*)")
            .eq("role", "instructor");

        const { data: profiles, error } = await query;

        if (error) throw error;

        // Transform data to match the expected Instructor type in the frontend
        const instructors = (profiles || []).map((p: any) => {
            const currentTransmission = p.instructor_profiles?.vehicle_transmission as "Auto" | "Manual" || "Auto";
            const vehicleModel = p.instructor_profiles?.vehicle_model || "Standard Car";
            const vehicleYear = p.instructor_profiles?.vehicle_year || 2020;

            // Attempt some very basic mock mapping for UI fields if they are empty
            return {
                id: p.id,
                name: p.full_name || "Unknown Instructor",
                location: p.instructor_profiles?.suburbs_covered?.[0] || postcode || "Local Area",
                vehicle: `${vehicleYear} ${vehicleModel}`,
                transmission: currentTransmission,
                rating: p.instructor_profiles?.rating || 5,
                reviews: p.instructor_profiles?.review_count || 10,
                price: p.instructor_profiles?.hourly_rate || 75,
                image: p.avatar_url || p.instructor_profiles?.vehicle_image_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
                suburbs_covered: p.instructor_profiles?.suburbs_covered || [],
                id_verified: p.instructor_profiles?.id_verified || false,
                nextAvailable: "Available Soon", // Could integrate get-available-slots calculation here if needed
            };
        });

        // Handle Optional Client Side Filters explicitly here if we want API-level filtering
        let finalInstructors = instructors;
        if (filters) {
            if (filters.transmission && filters.transmission.length > 0) {
                finalInstructors = finalInstructors.filter((i: any) => filters.transmission.includes(i.transmission));
            }
            if (filters.maxPrice) {
                finalInstructors = finalInstructors.filter((i: any) => i.price <= filters.maxPrice);
            }
        }


        return new Response(JSON.stringify({ instructors: finalInstructors }), {
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
