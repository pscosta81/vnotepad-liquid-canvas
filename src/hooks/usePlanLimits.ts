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


export const usePlanLimits = () => {
  const { user } = useAuth();

  const { data: usageData, isLoading: limitsLoading } = useQuery({
    queryKey: ["user-usage-limits", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1. Fetch user's company and plan details
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          company_id,
          companies:company_id(plan_id, subscription_status, trial_end)
        `)
        .eq("user_id", user.id)
        .single();
      
      const company = profile?.companies as any;
      if (!company) return null;

      // 2. Determine active plan (if trial expired and not paid, fallback to empty or handle lock)
      const now = new Date();
      const trialEnd = new Date(company.trial_end);
      const isTrialActive = company.subscription_status === 'trialing' && trialEnd > now;
      const isPaidActive = company.subscription_status === 'active';
      const isExpired = !isTrialActive && !isPaidActive;

      const basePlan = company.plan_id || 'free';
      // MOCK: If it's active trial, allow them to act as fully unlimited 'enterprise' for 7 days? 
      // The user requested: "Limites no trial limit the quantity of functionality like amount of notes, amount of calendar".
      // So trial behaves like 'free' plan but works for 7/30 days. When expired, it throws error or locks.
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
