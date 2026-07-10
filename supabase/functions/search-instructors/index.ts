import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { postcode, suburb, filters } = await req.json().catch(() => ({}));

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*, instructor_profiles(*), instructor_packages:instructor_packages(*)")
      .eq("role", "instructor");
    if (error) throw error;

    let instructors = (profiles ?? [])
      .map((p: any) => {
        const ip = Array.isArray(p.instructor_profiles)
          ? p.instructor_profiles[0]
          : p.instructor_profiles;
        if (!ip) return null;
        return {
          id: p.id,
          full_name: p.full_name || "Unknown Instructor",
          avatar_url: p.avatar_url || ip.vehicle_image_url || null,
          location: ip.suburbs_covered?.[0] || "Local Area",
          suburbs_covered: ip.suburbs_covered || [],
          postcodes_covered: ip.postcodes_covered || [],
          vehicle: {
            model: ip.vehicle_model || "Standard Car",
            year: ip.vehicle_year || 2020,
            transmission: ip.vehicle_transmission || "Auto",
            image_url: ip.vehicle_image_url || null,
          },
          transmission: ip.vehicle_transmission || "Auto",
          dual_control: ip.dual_control ?? false,
          rating: Number(ip.rating) || 0,
          reviews: ip.review_count || 0,
          hourly_rate: ip.hourly_rate || 75,
          price: ip.hourly_rate || 75,
          id_verified: ip.id_verified || false,
          verified: ip.id_verified || false,
          verification_status: ip.verification_status,
          stripe_onboarding_complete: ip.stripe_onboarding_complete || false,
          packages: (p.instructor_packages ?? []).filter((pk: any) => pk.active),
        };
      })
      .filter(Boolean) as any[];

    // Suspended instructors never appear in search.
    instructors = instructors.filter(
      (i) => i.verification_status !== "suspended" && i.verification_status !== "rejected",
    );

    if (postcode) {
      instructors = instructors.filter(
        (i) =>
          i.postcodes_covered.length === 0 ||
          i.postcodes_covered.includes(String(postcode)),
      );
    }
    if (suburb) {
      const s = String(suburb).toLowerCase();
      instructors = instructors.filter(
        (i) =>
          i.suburbs_covered.length === 0 ||
          i.suburbs_covered.some((x: string) => x.toLowerCase().includes(s)),
      );
    }
    if (filters) {
      if (filters.transmission?.length) {
        instructors = instructors.filter((i) =>
          filters.transmission.includes(i.transmission)
        );
      }
      if (filters.maxPrice) {
        instructors = instructors.filter((i) => i.price <= filters.maxPrice);
      }
      if (filters.minRating) {
        instructors = instructors.filter(
          (i) => i.reviews === 0 || i.rating >= filters.minRating,
        );
      }
      if (filters.dualControl) {
        instructors = instructors.filter((i) => i.dual_control);
      }
      if (filters.hasTestPackage) {
        instructors = instructors.filter((i) =>
          i.packages.some((pk: any) => pk.package_type === "test_package")
        );
      }
    }

    return jsonResponse({ instructors });
  } catch (error: any) {
    return errorResponse(error.message ?? "Search failed");
  }
});
