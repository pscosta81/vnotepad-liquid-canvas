import { useState } from "react";
import { X, Check, Zap, Star, Building2, ExternalLink } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    id: "free",
    name: "Trial",
    badge: "ATUAL",
    badgeColor: "bg-muted text-muted-foreground",
    price: "Grátis",
    period: "7 dias",
    color: "border-border",
    glowColor: "",
    icon: <Zap size={22} className="text-muted-foreground" />,
    features: [
      { text: "Até 20 anotações", included: true },
      { text: "Até 10 eventos no calendário", included: true },
      { text: "Backup XLSX protegido", included: false },
      { text: "Exportação de dados", included: false },
      { text: "Suporte prioritário", included: false },
    ],
    cta: "Plano Atual",
    ctaDisabled: true,
  },
  {
    id: "pro",
    name: "Profissional",
    badge: "MAIS POPULAR",
    badgeColor: "bg-primary text-primary-foreground",
    price: "R$ 49",
    period: "/mês por empresa",
    color: "border-primary",
    glowColor: "shadow-[0_0_24px_rgba(var(--primary)/0.3)]",
    icon: <Star size={22} className="text-primary" />,
    features: [
      { text: "Anotações ilimitadas", included: true },
      { text: "Calendário ilimitado", included: true },
      { text: "Backup XLSX protegido", included: true },
      { text: "Exportação de dados", included: true },
      { text: "Suporte prioritário", included: false },
    ],
    cta: "Assinar Profissional",
    ctaDisabled: false,
    mpLink: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=f92f126fe4fa4361b5cd3524cb54d724",
  },
  {
    id: "enterprise",
    name: "Empresarial",
    badge: "COMPLETO",
    badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    price: "R$ 119",
    period: "/mês por empresa",
    color: "border-amber-500/50",
    glowColor: "shadow-[0_0_24px_rgba(245,158,11,0.2)]",
    icon: <Building2 size={22} className="text-amber-400" />,
    features: [
      { text: "Anotações ilimitadas", included: true },
      { text: "Calendário ilimitado", included: true },
      { text: "Backup XLSX protegido", included: true },
      { text: "Exportação de dados", included: true },
      { text: "Suporte prioritário 24h", included: true },
    ],
    cta: "Assinar Empresarial",
    ctaDisabled: false,
    mpLink: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=dbfde7e6b8e346f9a6bf35f6042df2c3",
  },
];

const PricingModal = ({ open, onOpenChange }: PricingModalProps) => {
  const { usageData } = usePlanLimits();
  const [hovered, setHovered] = useState<string | null>(null);

  if (!open) return null;

  const trialEnd = usageData?.company?.trial_end
    ? new Date(usageData.company.trial_end)
    : null;
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div className="glass-panel neon-glow w-full max-w-4xl max-h-[95vh] overflow-y-auto animate-note-enter p-6 md:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Escolha seu Plano</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Desbloqueie todo o potencial do VnotePad para sua empresa
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Trial Status Banner */}
        {daysLeft !== null && daysLeft > 0 && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
            <Zap size={16} className="text-primary shrink-0" />
            <p className="text-sm text-primary font-medium">
              Seu período de teste termina em <strong>{daysLeft} dia{daysLeft !== 1 ? "s" : ""}</strong>. Assine agora e mantenha acesso completo.
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHovered(plan.id)}
              onMouseLeave={() => setHovered(null)}
              className={`relative rounded-xl border-2 p-5 flex flex-col gap-4 transition-all duration-300 cursor-default
                ${plan.color} ${plan.glowColor}
                ${hovered === plan.id && !plan.ctaDisabled ? "scale-[1.02]" : ""}
              `}
            >
              {/* Badge */}
              <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full tracking-widest ${plan.badgeColor}`}>
                {plan.badge}
              </span>

              {/* Plan Icon & Name */}
              <div className="flex items-center gap-3 mt-2">
                <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
                  {plan.icon}
                </div>
                <div>
                  <p className="font-semibold text-base">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                </div>
              </div>

              {/* Price */}
              <div>
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.id !== "free" && (
                  <span className="text-xs text-muted-foreground ml-1">/mês</span>
                )}
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className={`flex items-center gap-2.5 text-sm ${feat.included ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${feat.included ? "bg-primary/20" : "bg-muted/20"}`}>
                      <Check size={10} className={feat.included ? "text-primary" : "text-muted-foreground/30"} />
                    </span>
                    {feat.text}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {plan.ctaDisabled ? (
                <button
                  disabled
                  className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium bg-muted/30 text-muted-foreground cursor-default"
                >
                  {plan.cta}
                </button>
              ) : (
                <a
                  href={plan.mpLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-raised w-full mt-2 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {plan.cta}
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Pagamentos processados com segurança via <strong>Mercado Pago</strong>. Cancele a qualquer momento.
          Após o pagamento, entre em contato para ativação manual do seu plano.
        </p>
      </div>
    </div>
  );
};

export default PricingModal;
