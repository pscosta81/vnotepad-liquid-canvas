import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Building2, TrendingUp, Clock, XCircle, CheckCircle,
  RefreshCw, ChevronDown, Search, ArrowLeft, Zap, Star
} from "lucide-react";

const ADMIN_EMAIL = "psc.paulo81@gmail.com";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Company {
  id: string;
  name: string;
  plan_id: string;
  subscription_status: string;
  trial_start: string;
  trial_end: string;
  mp_subscription_id: string | null;
  user_count: number;
  notes_count: number;
  calendar_count: number;
  users: { id: string; email: string; display_name: string }[];
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  trialing:  { label: "Trial",    color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/30", icon: <Clock size={12} /> },
  active:    { label: "Ativo",    color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: <CheckCircle size={12} /> },
  canceled:  { label: "Cancelado",color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30", icon: <XCircle size={12} /> },
  past_due:  { label: "Pendente", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30", icon: <Clock size={12} /> },
  unpaid:    { label: "Inadimpl.",color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30", icon: <XCircle size={12} /> },
};

const PLAN_CONFIG: Record<string, { label: string; color: string; price: number }> = {
  free:       { label: "Trial",       color: "text-muted-foreground", price: 0 },
  pro:        { label: "Profissional",color: "text-primary",          price: 49 },
  enterprise: { label: "Empresarial", color: "text-amber-400",        price: 119 },
};

const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const { user, session } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="carbon-fiber fixed inset-0 flex items-center justify-center">
        <p className="text-destructive">Acesso negado.</p>
      </div>
    );
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-data`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setCompanies(data.companies ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAction = async (companyId: string, action: string, extra?: Record<string, any>) => {
    setActionLoading(companyId + action);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/admin-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ company_id: companyId, action, ...extra }),
      });
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  // Metrics
  const total = companies.length;
  const active = companies.filter(c => c.subscription_status === "active").length;
  const trialing = companies.filter(c => c.subscription_status === "trialing").length;
  const expired = companies.filter(c => ["canceled","past_due","unpaid"].includes(c.subscription_status)).length;
  const mrr = companies
    .filter(c => c.subscription_status === "active")
    .reduce((sum, c) => sum + (PLAN_CONFIG[c.plan_id]?.price ?? 0), 0);

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.users.some(u => u.email?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || c.subscription_status === filter ||
      (filter === "expired" && ["canceled","past_due","unpaid"].includes(c.subscription_status));
    return matchSearch && matchFilter;
  });

  const getDaysLeft = (trialEnd: string) => {
    if (!trialEnd) return 0;
    return Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000));
  };

  return (
    <div className="carbon-fiber fixed inset-0 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel de Administração</h1>
            <p className="text-sm text-muted-foreground">VnotePad SaaS — visão completa dos clientes</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Empresas", value: total, icon: <Building2 size={18} />, color: "text-blue-400" },
            { label: "Ativas", value: active, icon: <CheckCircle size={18} />, color: "text-emerald-400" },
            { label: "Em Trial", value: trialing, icon: <Clock size={18} />, color: "text-amber-400" },
            { label: "Expiradas", value: expired, icon: <XCircle size={18} />, color: "text-red-400" },
            { label: "MRR", value: `R$ ${mrr}`, icon: <TrendingUp size={18} />, color: "text-primary" },
          ].map((m) => (
            <div key={m.label} className="glass-panel rounded-xl p-4 flex flex-col gap-1">
              <span className={`${m.color}`}>{m.icon}</span>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empresa ou e-mail..."
              className="w-full bg-muted/20 border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "Todos" },
              { key: "active", label: "Ativos" },
              { key: "trialing", label: "Trial" },
              { key: "expired", label: "Expirados" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filter === f.key
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "bg-muted/20 text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Companies Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              <RefreshCw size={16} className="animate-spin mr-2" /> Carregando dados...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Nenhuma empresa encontrada.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((company) => {
                const status = STATUS_CONFIG[company.subscription_status] ?? STATUS_CONFIG.trialing;
                const plan = PLAN_CONFIG[company.plan_id] ?? PLAN_CONFIG.free;
                const daysLeft = company.subscription_status === "trialing" ? getDaysLeft(company.trial_end) : null;
                const isExpanded = expandedRow === company.id;
                const isLoading = (key: string) => actionLoading === company.id + key;

                return (
                  <div key={company.id}>
                    <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">

                      {/* Company info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{company.name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.bg} ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className={`text-xs font-medium ${plan.color}`}>
                            {plan.label === "Trial" ? <Zap size={12} className="inline mr-0.5" />  : <Star size={12} className="inline mr-0.5" />}
                            {plan.label}
                          </span>
                          {daysLeft !== null && (
                            <span className={`text-[10px] ${daysLeft <= 2 ? "text-red-400" : "text-amber-400"}`}>
                              {daysLeft === 0 ? "⚠ Expira hoje" : `${daysLeft}d restantes`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span><Users size={11} className="inline mr-0.5" />{company.user_count} usuário{company.user_count !== 1 ? "s" : ""}</span>
                          <span>📝 {company.notes_count} notas</span>
                          <span>📅 {company.calendar_count} eventos</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Extend trial */}
                        {["trialing", "canceled", "past_due", "unpaid"].includes(company.subscription_status) && (
                          <div className="flex gap-1">
                            {[7, 30, 60].map(d => (
                              <button
                                key={d}
                                disabled={!!actionLoading}
                                onClick={() => runAction(company.id, "extend_trial", { days: d })}
                                className="px-2 py-1 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                              >
                                {isLoading("extend_trial") ? "..." : `+${d}d`}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Change plan */}
                        {["free","pro","enterprise"].filter(p => p !== company.plan_id).map(p => (
                          <button
                            key={p}
                            disabled={!!actionLoading}
                            onClick={() => runAction(company.id, "change_plan", { plan: p })}
                            className="px-2 py-1 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
                          >
                            {isLoading("change_plan") ? "..." : `→ ${PLAN_CONFIG[p].label}`}
                          </button>
                        ))}

                        {/* Cancel / Reactivate */}
                        {company.subscription_status === "active" && (
                          <button
                            disabled={!!actionLoading}
                            onClick={() => runAction(company.id, "cancel")}
                            className="px-2 py-1 rounded-md text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        )}
                        {["canceled","past_due","unpaid"].includes(company.subscription_status) && (
                          <button
                            disabled={!!actionLoading}
                            onClick={() => runAction(company.id, "reactivate")}
                            className="px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            Reativar Trial
                          </button>
                        )}

                        {/* Expand users */}
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : company.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-all"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded users list */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-muted/10 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2 mt-3 font-medium uppercase tracking-wider">Usuários</p>
                        <div className="space-y-1">
                          {company.users.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhum usuário.</p>
                          ) : company.users.map(u => (
                            <div key={u.id} className="flex items-center gap-2 text-xs">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                                {(u.display_name || u.email || "?")[0].toUpperCase()}
                              </div>
                              <span className="text-foreground">{u.display_name}</span>
                              <span className="text-muted-foreground">{u.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
