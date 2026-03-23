import { useEffect, useRef } from "react";
import { Star, Trash2, Tag, Download } from "lucide-react";
import CalendarPanel from "@/components/CalendarPanel";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color?: string;
}

interface NoteEditorProps {
  note: Note | null;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  fullWidth?: boolean;
  categories?: Category[];
}

const NoteEditor = ({ note, onUpdate, onDelete, onToggleFavorite, fullWidth }: NoteEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [note?.content]);

  const exportNote = () => {
    if (!note) return;
    const blob = new Blob([`${note.title}\n\n${note.content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "nota"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!note) {
    return (
      <div className={`flex-1 flex flex-col gap-3 ${fullWidth ? "h-full" : ""}`}>
        <div className="glass-panel neon-glow flex-1 flex items-center justify-center rounded-lg">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-1">Nenhuma nota selecionada</p>
            <p className="text-sm">Selecione ou crie uma nota para começar</p>
          </div>
        </div>
        <CalendarPanel />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col gap-3 ${fullWidth ? "h-full" : ""}`}>
      <div className={`glass-panel neon-glow flex-1 flex flex-col animate-note-enter ${fullWidth ? "rounded-none" : ""}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag size={12} />
            <span>{note.category || "Sem tag"}</span>
            <span className="hidden sm:inline mx-2">•</span>
            <span className="hidden sm:inline">{note.updatedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={exportNote}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
              title="Exportar como .txt"
            >
              <Download size={16} />
            </button>
            <button
              onClick={() => onToggleFavorite(note.id)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                note.favorite
                  ? "text-yellow-400 hover:bg-yellow-400/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Star size={16} fill={note.favorite ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col px-4 md:px-6 py-5 overflow-y-auto">
          <input
            value={note.title}
            onChange={(e) => onUpdate(note.id, { title: e.target.value })}
            placeholder="Título da nota..."
            className="bg-transparent text-xl md:text-2xl font-semibold text-foreground placeholder:text-muted-foreground/40 outline-none mb-4 w-full"
          />
          <textarea
            ref={textareaRef}
            value={note.content}
            onChange={(e) => {
              onUpdate(note.id, { content: e.target.value });
              autoResize();
            }}
            placeholder="Comece a escrever..."
            className="bg-transparent text-foreground/90 text-[15px] leading-relaxed placeholder:text-muted-foreground/30 outline-none resize-none w-full min-h-[200px]"
          />
        </div>
      </div>
      <CalendarPanel />
    </div>
  );
};

export default NoteEditor;
