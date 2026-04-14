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

        const { id } = await req.json();
        if (!id) throw new Error("Instructor ID is required");

        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("*, instructor_profiles(*)")
            .eq("id", id)
            .single();

        if (error) throw error;
        if (!profile || !profile.instructor_profiles) {
            return new Response(JSON.stringify({ instructor: null }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const currentRole = profile.role as "learner" | "instructor";
        const currentTransmission = profile.instructor_profiles.vehicle_transmission as "Auto" | "Manual";

        const instructor = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: currentRole,
            avatar_url: profile.avatar_url,
            phone: profile.phone,
            bio: profile.instructor_profiles.bio,
            suburbs_covered: profile.instructor_profiles.suburbs_covered,
            vehicle: {
                model: profile.instructor_profiles.vehicle_model,
                year: profile.instructor_profiles.vehicle_year,
                transmission: currentTransmission,
                image_url: profile.instructor_profiles.vehicle_image_url,
            },
            hourly_rate: profile.instructor_profiles.hourly_rate,
            rating: profile.instructor_profiles.rating,
            review_count: profile.instructor_profiles.review_count,
            id_verified: profile.instructor_profiles.id_verified || false,
        };

        return new Response(JSON.stringify({ instructor }), {
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
