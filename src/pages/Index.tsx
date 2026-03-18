import { useState, useCallback, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import NoteList from "@/components/NoteList";
import NoteEditor from "@/components/NoteEditor";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Bem-vindo ao VnotePad",
      content: "Este é o seu novo bloco de notas premium. Experimente criar novas notas, organizar por tags e explorar a interface.\n\nDica: Use a barra de pesquisa para encontrar notas rapidamente.",
      category: "geral",
      favorite: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
    },
  ]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "geral", name: "Geral", icon: null },
    { id: "trabalho", name: "Trabalho", icon: null },
    { id: "pessoal", name: "Pessoal", icon: null },
  ]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeNoteId, setActiveNoteId] = useState<string | null>("1");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    let filtered = notes.filter((n) => !n.deleted);

    if (activeCategory === "favorites") {
      filtered = filtered.filter((n) => n.favorite);
    } else if (activeCategory === "trash") {
      filtered = notes.filter((n) => n.deleted);
    } else if (activeCategory !== "all") {
      filtered = filtered.filter((n) => n.category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [notes, activeCategory, searchQuery]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || null,
    [notes, activeNoteId]
  );

  const noteCount = useMemo(() => {
    const counts: Record<string, number> = {
      all: notes.filter((n) => !n.deleted).length,
      favorites: notes.filter((n) => n.favorite && !n.deleted).length,
      trash: notes.filter((n) => n.deleted).length,
    };
    categories.forEach((c) => {
      counts[c.id] = notes.filter((n) => n.category === c.id && !n.deleted).length;
    });
    return counts;
  }, [notes, categories]);

  const createNote = useCallback(() => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "",
      content: "",
      category: activeCategory !== "all" && activeCategory !== "favorites" && activeCategory !== "trash" ? activeCategory : "geral",
      favorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  }, [activeCategory]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n))
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, deleted: true, updatedAt: new Date() } : n))
    );
    setActiveNoteId(null);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n))
    );
  }, []);

  const addCategory = useCallback(() => {
    const name = prompt("Nome da nova tag:");
    if (name?.trim()) {
      const id = name.trim().toLowerCase().replace(/\s+/g, "-");
      setCategories((prev) => [...prev, { id, name: name.trim(), icon: null }]);
    }
  }, []);

  return (
    <div className="carbon-fiber fixed inset-0 flex items-center justify-center p-4">
      <div className="flex gap-3 w-full max-w-7xl h-[calc(100vh-2rem)] max-h-[900px]">
        <Sidebar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onAddCategory={addCategory}
          noteCount={noteCount}
        />
        <NoteList
          notes={filteredNotes}
          activeNoteId={activeNoteId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectNote={setActiveNoteId}
          onCreateNote={createNote}
        />
        <NoteEditor
          note={activeNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    </div>
  );
};

export default Index;
