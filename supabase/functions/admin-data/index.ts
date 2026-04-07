// Edge Function: admin-data
// Fetches all companies with their users and usage stats (admin only)

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

    // Fetch all companies
    const { data: companies, error: compErr } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (compErr) throw compErr;

    // For each company, get users + usage counts
    const enriched = await Promise.all(
      (companies ?? []).map(async (company) => {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .eq("company_id", company.id);

        const userIds = (profiles ?? []).map((p) => p.user_id);

        // Get auth user emails
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const companyUsers = (authUsers?.users ?? [])
          .filter((u) => userIds.includes(u.id))
          .map((u) => ({ id: u.id, email: u.email, display_name: profiles?.find(p => p.user_id === u.id)?.display_name }));

        // Note and calendar counts
        let notesCount = 0;
        let calendarCount = 0;
        if (userIds.length > 0) {
          const { count: nc } = await supabase
            .from("notes")
            .select("*", { count: "exact", head: true })
            .in("user_id", userIds)
            .eq("deleted", false);
          notesCount = nc ?? 0;

          const { count: cc } = await supabase
            .from("calendar_entries")
            .select("*", { count: "exact", head: true })
            .in("user_id", userIds);
          calendarCount = cc ?? 0;
        }

        return {
          ...company,
          users: companyUsers,
          user_count: companyUsers.length,
          notes_count: notesCount,
          calendar_count: calendarCount,
        };
      })
    );

    return new Response(JSON.stringify({ companies: enriched }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
