import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

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

    // Get the auth user
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { instructor_id, start_time, end_time, pickup_address } = await req.json();

    // Fetch instructor details for destination charge - CRITICAL: Always use DB price
    const { data: instructor, error: instructorError } = await supabaseClient
      .from("instructor_profiles")
      .select("hourly_rate, stripe_account_id")
      .eq("id", instructor_id)
      .single();

    if (instructorError || !instructor) {
      throw new Error("Instructor profile not found or invalid.");
    }

    // Ensure we have a valid rate from the database
    const rate = instructor.hourly_rate;
    if (!rate || rate <= 0) {
      throw new Error("Invalid instructor hourly rate configuration.");
    }

    const actualPrice = rate * 100; // Convert to cents
    const platformFee = Math.round(actualPrice * 0.15); // 15% platform fee

    if (!instructor?.stripe_account_id) {
      throw new Error("Instructor has not completed Stripe onboarding.");
    }

    const sessionMetadata = {
      instructor_id,
      learner_id: user.id,
      start_time,
      end_time,
      pickup_address,
      price: (actualPrice / 100).toString(),
    };

    // Conditionally enable invoice creation for lessons > $82.50 (inclusive of GST)
    // $82.50 AUD = 8250 cents
    const shouldCreateInvoice = actualPrice > 8250;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "SkillDrive Driving Lesson",
              description: `Lesson on ${new Date(start_time).toLocaleString()}`,
            },
            unit_amount: actualPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: instructor.stripe_account_id,
        },
      },
      // Configure Stripe Tax support for 10% GST on Australian transactions
      automatic_tax: { enabled: true },
      // Generate Tax Invoices including SkillDrive's ABN if applicable
      invoice_creation: shouldCreateInvoice ? {
        enabled: true,
        invoice_data: {
          custom_fields: [
            { name: 'SkillDrive ABN', value: Deno.env.get('SKILLDRIVE_ABN') || '12 345 678 901' },
          ],
        },
      } : { enabled: false },
      metadata: sessionMetadata,
      success_url: `${req.headers.get("origin")}/dashboard?success=true`,
      cancel_url: `${req.headers.get("origin")}/checkout?canceled=true`,
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
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
