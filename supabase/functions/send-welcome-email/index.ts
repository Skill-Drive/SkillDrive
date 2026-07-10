import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { sendEmail, templates } from "../_shared/email.ts";

// Called by the frontend right after a successful signup. The role and name
// are read from the authenticated user's profile, never from the request.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing Authorization header", 401);
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !user) return errorResponse("Unauthorized", 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", user.id)
      .single();
    if (!profile?.email) return errorResponse("Profile not found", 404);

    const firstName = profile.full_name?.split(" ")[0] || "there";
    const tpl = templates.welcome(firstName, profile.role);
    const ok = await sendEmail({ to: profile.email, ...tpl });

    return jsonResponse({ sent: ok });
  } catch (error: any) {
    return errorResponse(error.message ?? "Welcome email failed");
  }
});
