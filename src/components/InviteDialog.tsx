import { useState } from "react";
import { X, UserPlus, Mail, CheckCircle, AlertCircle, Loader2, Users } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";

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
  const [tempPassword, setTempPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  const company = usageData?.company as any;
  const planLimits: Record<string, number> = { free: 5, pro: 20, enterprise: 100 };
  const maxMembers = planLimits[company?.plan_id] ?? 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (!usageData || !usageData.company) {
      setStatus("error");
      setErrorMsg("Carregando dados da empresa... Aguarde um instante ou verifique se você possui uma empresa vinculada no Perfil.");
      return;
    }

    const company = usageData.company as any;
    const generatedPass = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    setStatus("loading");
    setErrorMsg("");

    try {
      // ... (verificaçoes de limite mantidas) ...
      const { count: memberCount, error: countErr } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);

      if (countErr) throw new Error(`Erro ao contar membros: ${countErr.message}`);

      if ((memberCount ?? 0) >= maxMembers) {
        setStatus("limit");
        return;
      }

      // 2. Insere na tabela de convites com a SENHA TEMPORARIA
      const { error: inviteErr } = await supabase
        .from("invites")
        .insert([{ 
          email: email.trim().toLowerCase(), 
          company_id: company.id,
          temp_password: generatedPass
        }]);

      if (inviteErr) {
        setStatus("error");
        setErrorMsg(`Erro no banco: ${inviteErr.message}`);
        return;
      }

      setTempPassword(generatedPass);
      setStatus("success");
    } catch (err: any) {
      console.error("Erro completo no convite:", err);
      setStatus("error");
      setErrorMsg(`Erro inesperado: ${err.message || "Verifique sua conexão"}`);
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
              <p className="font-semibold text-emerald-400">Convite gerador com sucesso!</p>
              <p className="text-sm text-muted-foreground mt-1 px-2">
                Envie estes dados para o funcionário:
              </p>
            </div>
            
            <div className="w-full bg-muted/30 border border-dashed border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">E-mail de Acesso</span>
                <span className="text-sm font-mono">{email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Senha Temporária</span>
                <span className="text-2xl font-mono font-bold tracking-wider text-primary">{tempPassword}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                onClick={() => {
                  const text = `Seu acesso ao VnotePad está pronto!\n\nEmail: ${email}\nSenha: ${tempPassword}\n\nBaixe o app e entre com esses dados. Você deverá trocar sua senha no primeiro acesso.`;
                  window.open(`mailto:${email}?subject=Seu Acesso ao VnotePad&body=${encodeURIComponent(text)}`);
                }}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Mail size={16} /> Enviar por E-mail
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                   const text = `Seu acesso ao VnotePad está pronto!\n\nEmail: ${email}\nSenha: ${tempPassword}`;
                   navigator.clipboard.writeText(text);
                   alert("Copiado! Agora você pode colar no WhatsApp.");
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-all"
                >
                  Copiar Dados
                </button>
                <button
                  onClick={() => setStatus("idle")}
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-all"
                >
                  Novo Convite
                </button>
              </div>
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
              <p>🔒 Ao gerar o convite, você garante uma vaga para este e-mail na <strong className="text-foreground">{company?.name}</strong>. Não é necessário enviar links de confirmação.</p>
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
