import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { email, user_type } = await req.json()

        if (!email || !user_type) {
            return new Response(JSON.stringify({ error: 'Email and user_type are required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Ensure user_type is valid
        if (user_type !== 'learner' && user_type !== 'instructor') {
            return new Response(JSON.stringify({ error: 'Invalid user_type. Must be learner or instructor.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Call inviteUserByEmail
        const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
            // In latest Supabase, redirectTo is useful if we have a specific frontend URL
            // redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?type=invite&redirect_to=/setup-password`
        });

        if (inviteError) throw inviteError;

        // To place it strictly in app_metadata as requested:
        if (inviteData.user) {
            const { error: updateError } = await supabaseClient.auth.admin.updateUserById(inviteData.user.id, {
                app_metadata: { user_type }
            });
            if (updateError) throw updateError;
        }

        return new Response(JSON.stringify({ user: inviteData.user, message: 'Invitation sent.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
