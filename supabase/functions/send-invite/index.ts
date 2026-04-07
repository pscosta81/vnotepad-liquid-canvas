// Edge Function: send-invite
// Sends a team invitation email via Supabase Auth admin
// The invited user receives an email with a magic link to set their password

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify caller is logged in
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { email } = await req.json();
    if (!email) return new Response("Missing email", { status: 400, headers: corsHeaders });

    // Get caller's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, companies:company_id(id, name, plan_id, subscription_status)")
      .eq("user_id", user.id)
      .single();

    const company = profile?.companies as any;
    if (!company) return new Response("Company not found", { status: 404, headers: corsHeaders });

    // Check plan limits
    const planLimits: Record<string, number> = { free: 5, pro: 20, enterprise: 100 };
    const maxMembers = planLimits[company.plan_id] ?? 5;

    // Count existing members
    const { count: memberCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.id);

    if ((memberCount ?? 0) >= maxMembers) {
      return new Response(
        JSON.stringify({ error: `Limite de ${maxMembers} funcionários atingido para o plano atual.` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // User exists - just add them to this company if not already there
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", existingUser.id)
        .single();

      if (existingProfile?.company_id === company.id) {
        return new Response(
          JSON.stringify({ error: "Este usuário já é membro da sua empresa." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update their company
      await supabase
        .from("profiles")
        .update({ company_id: company.id })
        .eq("user_id", existingUser.id);

      return new Response(JSON.stringify({ ok: true, existing: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // New user - send invite via Supabase Auth
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        company_id: company.id,
        company_name: company.name,
        invited_by: user.email,
      },
      redirectTo: `${SUPABASE_URL.replace('/rest/v1', '')}/auth/v1/callback`,
    });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, new_invite: true, email }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
