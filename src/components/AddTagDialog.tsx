import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TAG_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4",
  "#3B82F6", "#8B5CF6", "#EC4899", "#F43F5E", "#84CC16",
];

interface AddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, color: string) => void;
}

const AddTagDialog = ({ open, onOpenChange, onAdd }: AddTagDialogProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[4]);

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim(), color);
      setName("");
      setColor(TAG_COLORS[4]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nova Tag</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da tag..."
            className="bg-muted/30 border-border"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Cor do ícone</p>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all duration-200 ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: c,
                    ringColor: c,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTagDialog;
