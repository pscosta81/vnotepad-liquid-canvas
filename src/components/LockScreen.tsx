import { useState, useEffect } from "react";
import { Lock, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import logo from "@/assets/logo.png";

const LockScreen = () => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const { user, isAdmin, unlockApp, signOut } = useAuth();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Determinar o PIN correto
    let correctPin = user?.user_metadata?.pin;
    
    // Se não tiver PIN cadastrado mas for admin, default é 0000
    if (isAdmin) {
      correctPin = "0000";
    } else if (!correctPin) {
      // Fallback para contas antigas que não criaram PIN = 0000
      correctPin = "0000";
    }

    if (pin === correctPin) {
      setPin("");
      setFailedAttempts(0);
      unlockApp();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (newAttempts >= 3) {
        signOut();
      } else {
        setError(`PIN incorreto. Tentativas restantes: ${3 - newAttempts}`);
      }
    }
  };

  return (
    <div className="carbon-fiber fixed inset-0 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className={`glass-panel neon-glow w-full max-w-sm p-8 flex flex-col items-center gap-6 ${shake ? "animate-shake" : ""}`}
      >
        <img src={logo} alt="VnotePad" className="w-24 h-24" />
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Sessão Bloqueada</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Insira seu PIN para retornar.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
            <input
              type="password"
              value={pin}
              autoFocus
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              required
              maxLength={4}
              className={`w-full bg-muted/30 border border-border rounded-lg pl-10 pr-3 py-3 text-center text-xl tracking-[1em] text-foreground outline-none input-glow ${
                pin.length > 0 ? "input-raised" : "input-inset"
              }`}
            />
          </div>
          
          <button
            type="submit"
            className="btn-raised flex items-center justify-center w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            Desbloquear
          </button>
        </form>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors mt-2"
        >
          <LogOut size={14} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
};

export default LockScreen;
