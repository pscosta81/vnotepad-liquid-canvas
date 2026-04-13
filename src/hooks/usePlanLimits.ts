import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface PlanLimits {
  maxNotes: number | null; // null means unlimited
  maxCalendarEvents: number | null;
  canExport: boolean;
  canUseTeam: boolean;
}

const PLAN_LIMITS_MAP: Record<string, PlanLimits> = {
  free: {
    maxNotes: 25,
    maxCalendarEvents: 20,
    canExport: true,
    canUseTeam: true,
  },
  pro: {
    maxNotes: 100,
    maxCalendarEvents: 100,
    canExport: true,
    canUseTeam: true,
  },
  enterprise: {
    maxNotes: null, // Unlimited
    maxCalendarEvents: null,
    canExport: true,
    canUseTeam: true,
  },
};


const ADMIN_EMAIL = "psc.paulo81@gmail.com";

export const usePlanLimits = () => {
  const { user } = useAuth();

  // Admin always gets enterprise limits
  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: usageData, isLoading: limitsLoading } = useQuery({
    queryKey: ["user-usage-limits", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1. Fetch user's company and plan details
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          company_id,
          companies:company_id(id, name, plan_id, subscription_status, trial_end)
        `)
        .eq("user_id", user.id)
        .single();
      
      const company = profile?.companies as any;
      
      // Se não for admin e não tiver empresa, retorna null
      if (!company && !isAdmin) return null;

      // 2. Determine active plan
      const now = new Date();
      const trialEnd = company?.trial_end ? new Date(company.trial_end) : new Date(0);
      const isTrialActive = company?.subscription_status === 'trialing' && trialEnd > now;
      const isPaidActive = company?.subscription_status === 'active';
      const isExpired = !isAdmin && !isTrialActive && !isPaidActive;

      const basePlan = isAdmin ? 'enterprise' : (company?.plan_id || 'free');
      const limits = PLAN_LIMITS_MAP[basePlan] || PLAN_LIMITS_MAP['free'];

      // 3. Current Usage Counters
      const { count: notesCount } = await supabase
        .from("notes")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("deleted", false);

      const { count: calendarCount } = await supabase
        .from("calendar_entries")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      return {
        company,
        limits,
        usage: {
          notes: notesCount || 0,
          calendar: calendarCount || 0,
        },
        isTrialActive,
        isExpired,
      };
    },
    enabled: !!user,
  });

  return {
    usageData,
    limitsLoading,
    canCreateNote: usageData ? (usageData.limits.maxNotes === null || usageData.usage.notes < usageData.limits.maxNotes) : false,
    canCreateEvent: usageData ? (usageData.limits.maxCalendarEvents === null || usageData.usage.calendar < usageData.limits.maxCalendarEvents) : false,
    canExport: usageData ? usageData.limits.canExport : false,
  };
};
