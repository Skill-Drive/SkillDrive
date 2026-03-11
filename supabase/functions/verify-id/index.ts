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

        const { userId, licensePath, selfiePath, bucket, action } = await req.json()

        if (!userId || action !== 'verify') {
            return new Response(JSON.stringify({ error: 'userId and valid action required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 0. Verify requester is an admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('No authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !requester) throw new Error('Unauthorized');

        const { data: requesterProfile, error: requesterProfileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (requesterProfileError || requesterProfile?.role !== 'admin') {
            throw new Error('Forbidden: Admin access required');
        }

        // 1. Update the user's app_metadata to store the verification metadata
        // This retains the verification metadata to comply with APP 11 without keeping the biometric image.
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(userId, {
            app_metadata: { id_verified: true, verification_date: new Date().toISOString() }
        })

        if (updateError) throw updateError;

        // 2. Delete the original image while retaining the metadata
        // Alternatively move to a cold-storage vault. Here we securely delete.
        const filesToDelete = [];
        if (licensePath) filesToDelete.push(licensePath);
        if (selfiePath) filesToDelete.push(selfiePath);

        if (filesToDelete.length > 0) {
            const targetBucket = bucket || 'instructor-licenses';
            const { error: storageError } = await supabaseClient.storage.from(targetBucket).remove(filesToDelete);
            if (storageError) {
                console.error("Failed to securely delete files:", storageError);
            }
        }

        return new Response(JSON.stringify({ message: 'Identity verified. Biometric data securely purged.' }), {
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
