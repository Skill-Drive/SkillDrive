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

        const { email } = await req.json()

        // Self-invitation is allowed for this demo
        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Call inviteUserByEmail, injecting instructor role immediately
        const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email);

        if (inviteError) throw inviteError;

        if (inviteData.user) {
            const { error: updateError } = await supabaseClient.auth.admin.updateUserById(inviteData.user.id, {
                app_metadata: { user_type: 'instructor' }
            });
            if (updateError) throw updateError;
        }

        return new Response(JSON.stringify({ user: inviteData.user, message: 'Instructor Invitation sent.' }), {
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
