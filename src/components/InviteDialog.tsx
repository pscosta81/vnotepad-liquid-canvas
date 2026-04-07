import { useState } from "react";
import { X, UserPlus, Mail, CheckCircle, AlertCircle, Loader2, Users } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = "idle" | "loading" | "success" | "error" | "limit";

const InviteDialog = ({ open, onOpenChange }: InviteDialogProps) => {
  const { session } = useAuth();
  const { usageData } = usePlanLimits();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  const company = usageData?.company as any;
  const planLimits: Record<string, number> = { free: 5, pro: 20, enterprise: 100 };
  const maxMembers = planLimits[company?.plan_id] ?? 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setStatus("limit");
        } else {
          setStatus("error");
          setErrorMsg(data.error ?? "Erro ao enviar convite.");
        }
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Erro de conexão. Tente novamente.");
    }
  };

  const handleClose = () => {
    setEmail("");
    setStatus("idle");
    setErrorMsg("");
    onOpenChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="glass-panel neon-glow w-full max-w-md animate-note-enter p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <UserPlus size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Convidar Funcionário</h2>
              <p className="text-xs text-muted-foreground">
                {company?.name} · {maxMembers} vagas no plano atual
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Limit exceeded state */}
        {status === "limit" ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Users size={24} className="text-amber-400" />
            </div>
            <div>
              <p className="font-semibold">Limite de funcionários atingido</p>
              <p className="text-sm text-muted-foreground mt-1">
                Seu plano permite até <strong>{maxMembers} membros</strong>. Faça upgrade para adicionar mais.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity mt-2"
            >
              Ver Planos
            </button>
          </div>
        ) : status === "success" ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-emerald-400">Convite enviado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Um e-mail foi enviado para <strong>{email || "o convidado"}</strong> com o link de acesso ao VnotePad.
              </p>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => setStatus("idle")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
              >
                Convidar outro
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1.5">
                E-mail do funcionário
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@empresa.com"
                  required
                  disabled={status === "loading"}
                  className="w-full bg-muted/20 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Error message */}
            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Info box */}
            <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5 text-xs text-muted-foreground">
              <p>🔒 O funcionário receberá um e-mail seguro para criar sua senha. Ele terá acesso ao VnotePad como membro de <strong className="text-foreground">{company?.name}</strong>.</p>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !email.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <><Loader2 size={16} className="animate-spin" /> Enviando...</>
              ) : (
                <><UserPlus size={16} /> Enviar Convite</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default InviteDialog;
