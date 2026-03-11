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

        // 1. Verify requester is an admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('No authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) throw new Error('Unauthorized');

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'admin') {
            throw new Error('Forbidden: Admin access required');
        }

        const { action, params } = await req.json();

        let result;

        switch (action) {
            case 'get-stats':
                const { count: userCount } = await supabaseClient.from('profiles').select('id', { count: 'exact', head: true });
                const { count: instructorCount } = await supabaseClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'instructor');
                const { count: bookingCount } = await supabaseClient.from('bookings').select('id', { count: 'exact', head: true });
                const { data: totalRevenueData } = await supabaseClient.from('bookings').select('price').eq('status', 'confirmed');

                result = {
                    totalUsers: userCount || 0,
                    totalInstructors: instructorCount || 0,
                    totalBookings: bookingCount || 0,
                    totalRevenue: (totalRevenueData || []).reduce((acc, b) => acc + (b.price || 0), 0)
                };
                break;

            case 'list-users':
                const { data: users, error: listError } = await supabaseClient
                    .from('profiles')
                    .select('*, learner_data(*), instructor_profiles(*)')
                    .order('created_at', { ascending: false });
                if (listError) throw listError;
                result = users;
                break;

            case 'update-user-role':
                const { userId, newRole } = params;
                const { error: updateError } = await supabaseClient
                    .from('profiles')
                    .update({ role: newRole })
                    .eq('id', userId);
                if (updateError) throw updateError;

                // Sync app_metadata
                await supabaseClient.auth.admin.updateUserById(userId, {
                    app_metadata: { user_role: newRole }
                });

                result = { success: true };
                break;

            case 'delete-user':
                const { userIdToDelete } = params;
                const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userIdToDelete);
                if (deleteError) throw deleteError;
                result = { success: true };
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify(result), {
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
