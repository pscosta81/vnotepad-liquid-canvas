import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  // Allow only 4 numbers
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
  };

  const handleExport = async () => {
    if (pin.length !== 4) {
      toast.error("O PIN de segurança deve ter exatamente 4 dígitos numéricos.");
      return;
    }
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }

    setLoading(true);
    try {
      // Fetch active notes
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false)
        .order("updated_at", { ascending: false });

      if (notesError) throw notesError;

      // Fetch active calendar events (just all for the user in this case)
      const { data: calendarData, error: calError } = await supabase
        .from("calendar_entries")
        .select("*")
        .eq("user_id", user.id);

      if (calError) throw calError;

      // Ensure electron is available
      if (typeof window !== "undefined" && (window as any).electron) {
        const result = await (window as any).electron.exportXlsx(
          { notes: notesData || [], calendar: calendarData || [] },
          pin
        );

        if (result.success) {
          toast.success("Backup exportado com sucesso!");
          onOpenChange(false);
          setPin("");
        } else {
          toast.error("Erro ao exportar: " + result.error);
        }
      } else {
        toast.error("Exportação disponível apenas no aplicativo Desktop.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Falha ao exportar os dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] carbon-fiber border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exportar Backup Seguro
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Crie um arquivo protegido das suas Anotações e compromissos do Calendário atualmente ativos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Define um PIN de 4 dígitos para proteger seu arquivo Excel:
            </label>
            <input
              type="text"
              autoComplete="off"
              value={pin}
              onChange={handlePinChange}
              placeholder="Ex: 1234"
              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground font-mono tracking-widest outline-none focus:border-primary transition-colors text-center text-lg"
              disabled={loading}
              maxLength={4}
            />
            <span className="text-xs text-muted-foreground">
              Guarde este PIN. Você só poderá abrir o arquivo se inseri-lo.
            </span>
          </div>

          <button
            onClick={handleExport}
            disabled={loading || pin.length !== 4}
            className="w-full flex justify-center items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 hover:border-primary/50 transition-all rounded-lg py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gerar e Salvar Excel"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
