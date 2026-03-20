import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setIsInstalled(true));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="carbon-fiber fixed inset-0 flex items-center justify-center p-4">
      <div className="glass-panel neon-glow w-full max-w-lg p-8 flex flex-col items-center gap-6 animate-note-enter">
        <img src={logo} alt="VnotePad" className="w-32 h-32 animate-logo" />
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Instalar VnotePad</h1>

        {isInstalled ? (
          <div className="text-center space-y-3">
            <p className="text-secondary text-sm font-medium">✓ App já está instalado!</p>
            <button onClick={() => navigate("/")} className="btn-raised px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Abrir App
            </button>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Chrome / Android */}
            <div className="glass-panel-hover p-4 space-y-3">
              <div className="flex items-center gap-2 text-foreground text-sm font-medium">
                <Monitor size={18} />
                <span>Chrome / Android</span>
              </div>
              {deferredPrompt ? (
                <button onClick={handleInstall} className="btn-raised flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  <Download size={16} />
                  Instalar Agora
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Abra no Chrome e toque em <strong>"Adicionar à tela inicial"</strong> no menu do navegador (⋮).
                </p>
              )}
            </div>

            {/* iOS / Safari */}
            <div className="glass-panel-hover p-4 space-y-3">
              <div className="flex items-center gap-2 text-foreground text-sm font-medium">
                <Smartphone size={18} />
                <span>iPhone / iPad (Safari)</span>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Abra no Safari</li>
                <li>Toque no ícone de <strong>compartilhar</strong> (⬆)</li>
                <li>Selecione <strong>"Adicionar à Tela de Início"</strong></li>
              </ol>
            </div>
          </div>
        )}

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-2">
          <ArrowLeft size={14} />
          Voltar
        </button>
      </div>
    </div>
  );
};

export default Install;
