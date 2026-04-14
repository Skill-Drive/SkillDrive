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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for internal profile fetching
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const authHeader = req.headers.get("Authorization")!;
        if (!authHeader) throw new Error("Missing Authorization header");

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
            authHeader.replace("Bearer ", "")
        );

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select(`
                *,
                instructor_profiles(*),
                learner_data(*)
            `)
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Generate signed URLs for private license images
        const learnerData = Array.isArray(profile.learner_data) ? profile.learner_data[0] : profile.learner_data;
        const instructorProfile = Array.isArray(profile.instructor_profiles) ? profile.instructor_profiles[0] : profile.instructor_profiles;
        
        if (learnerData) {
            if (learnerData.license_front_url && !learnerData.license_front_url.includes('token=')) {
                const path = learnerData.license_front_url.split('/').pop();
                const filePath = `${user.id}/${path}`;
                const { data: signedData } = await supabaseClient.storage
                    .from('learner-licenses')
                    .createSignedUrl(filePath, 3600);
                if (signedData) learnerData.license_front_url = signedData.signedUrl;
            }
            if (learnerData.license_back_url && !learnerData.license_back_url.includes('token=')) {
                const path = learnerData.license_back_url.split('/').pop();
                const filePath = `${user.id}/${path}`;
                const { data: signedData } = await supabaseClient.storage
                    .from('learner-licenses')
                    .createSignedUrl(filePath, 3600);
                if (signedData) learnerData.license_back_url = signedData.signedUrl;
            }
        }

        if (instructorProfile) {
            if (instructorProfile.license_front_url && !instructorProfile.license_front_url.includes('token=')) {
                const path = instructorProfile.license_front_url.split('/').pop();
                const filePath = `${user.id}/${path}`;
                const { data: signedData } = await supabaseClient.storage
                    .from('instructor-licenses')
                    .createSignedUrl(filePath, 3600);
                if (signedData) instructorProfile.license_front_url = signedData.signedUrl;
            }
            if (instructorProfile.license_back_url && !instructorProfile.license_back_url.includes('token=')) {
                const path = instructorProfile.license_back_url.split('/').pop();
                const filePath = `${user.id}/${path}`;
                const { data: signedData } = await supabaseClient.storage
                    .from('instructor-licenses')
                    .createSignedUrl(filePath, 3600);
                if (signedData) instructorProfile.license_back_url = signedData.signedUrl;
            }
        }

        return new Response(JSON.stringify({ profile }), {
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
