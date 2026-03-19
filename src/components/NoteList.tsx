import { Search, Plus } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  fullWidth?: boolean;
}

const NoteList = ({ notes, activeNoteId, searchQuery, onSearchChange, onSelectNote, onCreateNote, fullWidth }: NoteListProps) => {
  return (
    <div className={`glass-panel neon-glow flex flex-col h-full ${fullWidth ? "w-full rounded-none" : "w-72"}`}>
      {/* Search + New */}
      <div className="p-3 flex flex-col gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar notas..."
            className="w-full bg-muted/30 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none input-glow transition-all duration-200"
          />
        </div>
        <button
          onClick={onCreateNote}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all duration-200 hover:shadow-[0_0_12px_hsla(187,94%,43%,0.3)]"
        >
          <Plus size={16} />
          Nova Nota
        </button>
      </div>

      {/* Notes */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {notes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Nenhuma nota encontrada
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {notes.map((note, i) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`animate-note-enter w-full text-left px-3 py-3 rounded-lg transition-all duration-200 group
                  ${activeNoteId === note.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/20 border border-transparent"
                  }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <p className={`text-sm font-medium truncate mb-1 ${
                  activeNoteId === note.id ? "text-primary" : "text-foreground"
                }`}>
                  {note.title || "Sem título"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {note.content || "Nota vazia..."}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                  {note.updatedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;
