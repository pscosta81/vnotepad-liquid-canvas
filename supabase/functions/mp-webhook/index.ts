// Supabase Edge Function: mp-webhook
// Receives Mercado Pago subscription events and updates company subscription status

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") ?? "vnotepad-webhook-2024";

// Map of MP plan IDs to our internal plan names
const PLAN_MAP: Record<string, string> = {
  "f92f126fe4fa4361b5cd3524cb54d724": "pro",       // Profissional R$49
  "dbfde7e6b8e346f9a6bf35f6042df2c3": "enterprise", // Empresarial R$119
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate webhook secret via query param
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    if (secret !== WEBHOOK_SECRET) {
      console.error("Invalid webhook secret");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    // Only handle subscription events
    if (body.type !== "subscription_preapproval") {
      return new Response("OK - ignored", { status: 200, headers: corsHeaders });
    }

    const subscriptionId = body.data?.id;
    if (!subscriptionId) {
      return new Response("No subscription ID", { status: 400, headers: corsHeaders });
    }

    // Fetch subscription details from Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const subscription = await mpRes.json();
    console.log("Subscription details:", JSON.stringify(subscription));

    const payerEmail = subscription.payer_email;
    const mpStatus = subscription.status; // authorized, cancelled, paused
    const planId = PLAN_MAP[subscription.preapproval_plan_id] ?? "free";
    const mpSubscriptionId = subscription.id;
    const mpCustomerId = String(subscription.payer_id ?? "");

    if (!payerEmail) {
      return new Response("No payer email", { status: 400, headers: corsHeaders });
    }

    // Map MP status to our internal status
    const statusMap: Record<string, string> = {
      authorized: "active",
      cancelled: "canceled",
      paused: "past_due",
      pending: "trialing",
    };
    const subscriptionStatus = statusMap[mpStatus] ?? "past_due";

    // Initialize Supabase admin client (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Find user by email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const matchedUser = authUsers?.users?.find((u) => u.email === payerEmail);

    if (!matchedUser) {
      console.error(`User not found for email: ${payerEmail}`);
      return new Response("User not found", { status: 404, headers: corsHeaders });
    }

    // Find user's company via profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", matchedUser.id)
      .single();

    if (!profile?.company_id) {
      return new Response("Company not found for user", { status: 404, headers: corsHeaders });
    }

    // Update company subscription
    const { error } = await supabase
      .from("companies")
      .update({
        subscription_status: subscriptionStatus,
        plan_id: subscriptionStatus === "active" ? planId : "free",
        mp_subscription_id: mpSubscriptionId,
        mp_customer_id: mpCustomerId,
      })
      .eq("id", profile.company_id);

    if (error) {
      console.error("DB update error:", error);
      return new Response("DB error", { status: 500, headers: corsHeaders });
    }

    console.log(`✅ Company ${profile.company_id} updated: ${subscriptionStatus} / ${planId}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
