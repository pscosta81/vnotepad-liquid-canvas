// Edge Function: admin-action
// Performs admin actions: extend trial, change plan, cancel subscription

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "psc.paulo81@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    // Verify caller is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action, company_id, days, plan } = body;

    if (!company_id || !action) {
      return new Response("Missing company_id or action", { status: 400, headers: corsHeaders });
    }

    let updateData: Record<string, any> = {};

    if (action === "extend_trial") {
      // Extend trial from now or from current trial_end (whichever is later)
      const { data: company } = await supabase
        .from("companies")
        .select("trial_end, subscription_status")
        .eq("id", company_id)
        .single();

      const baseDate = company?.trial_end && new Date(company.trial_end) > new Date()
        ? new Date(company.trial_end)
        : new Date();
      
      const newTrialEnd = new Date(baseDate);
      newTrialEnd.setDate(newTrialEnd.getDate() + (days ?? 7));

      updateData = {
        trial_end: newTrialEnd.toISOString(),
        subscription_status: "trialing",
        plan_id: "free",
      };
    } else if (action === "change_plan") {
      const validPlans = ["free", "pro", "enterprise"];
      if (!validPlans.includes(plan)) {
        return new Response("Invalid plan", { status: 400, headers: corsHeaders });
      }
      updateData = {
        plan_id: plan,
        subscription_status: plan === "free" ? "trialing" : "active",
      };
    } else if (action === "cancel") {
      updateData = {
        subscription_status: "canceled",
        plan_id: "free",
      };
    } else if (action === "reactivate") {
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + 7);
      updateData = {
        subscription_status: "trialing",
        plan_id: "free",
        trial_end: newTrialEnd.toISOString(),
      };
    } else {
      return new Response("Unknown action", { status: 400, headers: corsHeaders });
    }

    const { error } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", company_id);

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, action, company_id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
