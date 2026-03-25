import { useState, useCallback, useMemo, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import NoteList from "@/components/NoteList";
import NoteEditor from "@/components/NoteEditor";
import AddTagDialog from "@/components/AddTagDialog";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowLeft } from "lucide-react";

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
  color?: string;
}

const DEFAULT_TAG_COLORS: Record<string, string> = {
  geral: "#06B6D4",
  trabalho: "#3B82F6",
  pessoal: "#8B5CF6",
};

const Index = () => {
  const { user, signOut, displayName } = useAuth();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "geral", name: "Geral", icon: null, color: DEFAULT_TAG_COLORS.geral },
    { id: "trabalho", name: "Trabalho", icon: null, color: DEFAULT_TAG_COLORS.trabalho },
    { id: "pessoal", name: "Pessoal", icon: null, color: DEFAULT_TAG_COLORS.pessoal },
  ]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load notes from DB
  useEffect(() => {
    if (!user) return;
    const loadNotes = async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!error && data) {
        setNotes(
          data.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            category: n.category,
            favorite: n.favorite,
            createdAt: new Date(n.created_at),
            updatedAt: new Date(n.updated_at),
            deleted: n.deleted,
          }))
        );
      }
    };
    loadNotes();
  }, [user]);

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

  const createNote = useCallback(async () => {
    if (!user) return;
    const category =
      activeCategory !== "all" && activeCategory !== "favorites" && activeCategory !== "trash"
        ? activeCategory
        : "geral";

    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: user.id, title: "", content: "", category })
      .select()
      .single();

    if (!error && data) {
      const newNote: Note = {
        id: data.id,
        title: data.title,
        content: data.content,
        category: data.category,
        favorite: data.favorite,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        deleted: data.deleted,
      };
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      if (isMobile) setMobileView("editor");
    }
  }, [activeCategory, user, isMobile]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n))
    );
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.favorite !== undefined) dbUpdates.favorite = updates.favorite;
    if (updates.deleted !== undefined) dbUpdates.deleted = updates.deleted;

    if (Object.keys(dbUpdates).length > 0) {
      supabase.from("notes").update(dbUpdates).eq("id", id).then();
    }
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, deleted: true, updatedAt: new Date() } : n))
    );
    supabase.from("notes").update({ deleted: true }).eq("id", id).then();
    setActiveNoteId(null);
    if (isMobile) setMobileView("list");
  }, [isMobile]);

  const toggleFavorite = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const newFav = !n.favorite;
          supabase.from("notes").update({ favorite: newFav }).eq("id", id).then();
          return { ...n, favorite: newFav };
        }
        return n;
      })
    );
  }, []);

  const addCategory = useCallback(() => {
    setAddTagOpen(true);
  }, []);

  const handleAddTag = useCallback((name: string, color: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    setCategories((prev) => [...prev, { id, name, icon: null, color }]);
  }, []);

  const deleteCategory = useCallback((catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (activeCategory === catId) setActiveCategory("all");
  }, [activeCategory]);

  const clearTrash = useCallback(async () => {
    const trashNotes = notes.filter((n) => n.deleted);
    if (trashNotes.length === 0) return;
    const ids = trashNotes.map((n) => n.id);
    setNotes((prev) => prev.filter((n) => !n.deleted));
    setActiveNoteId(null);
    await supabase.from("notes").delete().in("id", ids);
  }, [notes]);

  const handleSelectNote = useCallback((id: string) => {
    setActiveNoteId(id);
    if (isMobile) setMobileView("editor");
  }, [isMobile]);

  const handleCategoryChange = useCallback((id: string) => {
    setActiveCategory(id);
    setActiveNoteId(null);
    setSidebarOpen(false);
    if (isMobile) setMobileView("list");
  }, [isMobile]);

  const sidebarContent = (
    <Sidebar
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={handleCategoryChange}
      onAddCategory={addCategory}
      onDeleteCategory={deleteCategory}
      noteCount={noteCount}
      onSignOut={signOut}
      userName={displayName}
      onClearTrash={clearTrash}
    />
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="carbon-fiber fixed inset-0 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background/80 backdrop-blur-lg z-10">
          {mobileView === "editor" ? (
            <button onClick={() => setMobileView("list")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-background border-border">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          )}
          <span className="text-sm font-medium text-foreground flex-1">VnotePad</span>
        </div>

        <div className="flex-1 overflow-hidden">
          {mobileView === "list" ? (
            <NoteList
              notes={filteredNotes}
              activeNoteId={activeNoteId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectNote={handleSelectNote}
              onCreateNote={createNote}
              fullWidth
            />
          ) : (
            <NoteEditor
              note={activeNote}
              onUpdate={updateNote}
              onDelete={deleteNote}
              onToggleFavorite={toggleFavorite}
              fullWidth
              categories={categories}
            />
          )}
        </div>

        <AddTagDialog open={addTagOpen} onOpenChange={setAddTagOpen} onAdd={handleAddTag} />
      </div>
    );
  }

  // Desktop/Tablet layout
  return (
    <div className="carbon-fiber fixed inset-0 flex items-center justify-center p-4">
      <div className="flex gap-3 w-full max-w-7xl h-[calc(100vh-2rem)] max-h-[900px]">
        <div className="hidden lg:flex">
          {sidebarContent}
        </div>
        <div className="lg:hidden flex items-start pt-2">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button className="p-2 glass-panel text-muted-foreground hover:text-foreground transition-colors">
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-background border-border">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>
        <NoteList
          notes={filteredNotes}
          activeNoteId={activeNoteId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectNote={handleSelectNote}
          onCreateNote={createNote}
        />
        <NoteEditor
          note={activeNote}
          onUpdate={updateNote}
          onDelete={deleteNote}
          onToggleFavorite={toggleFavorite}
          categories={categories}
        />
      </div>

      <AddTagDialog open={addTagOpen} onOpenChange={setAddTagOpen} onAdd={handleAddTag} />
    </div>
  );
};

export default Index;
