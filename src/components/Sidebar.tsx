import { useState } from "react";
import { Plus, Hash, Inbox, Star, Trash2, LogOut, X, FileSpreadsheet, ShieldCheck, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import ExportDialog from "./ExportDialog";
import InviteDialog from "./InviteDialog";
import logo from "@/assets/logo.png";

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color?: string;
}

interface SidebarProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onAddCategory: () => void;
  onDeleteCategory?: (id: string) => void;
  noteCount: Record<string, number>;
  onSignOut?: () => void;
  userName?: string | null;
  onClearTrash?: () => void;
  onOpenPricing?: () => void;
}

const defaultCategories = [
  { id: "all", name: "Todas as Notas", icon: <Inbox size={18} /> },
  { id: "favorites", name: "Favoritos", icon: <Star size={18} /> },
  { id: "trash", name: "Lixeira", icon: <Trash2 size={18} /> },
];

const Sidebar = ({ categories, activeCategory, onCategoryChange, onAddCategory, onDeleteCategory, noteCount, onSignOut, userName, onClearTrash, onOpenPricing }: SidebarProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="glass-panel neon-glow flex flex-col w-64 h-full p-4 gap-2">
      {/* Greeting */}
      {userName && (
        <div className="text-center px-2 mb-1">
          <p className="text-sm text-primary font-medium">Olá {userName}</p>
          <p className="text-xs text-muted-foreground">Bem vindo a sua agenda pessoal</p>
        </div>
      )}

      {/* Logo + Name */}
      <div className="flex flex-col items-center px-2 py-3 mb-4">
        <img src={logo} alt="VnotePad" className="w-32 h-32 animate-logo" />
        <span className="text-lg font-semibold text-foreground tracking-tight mt-2">VnotePad</span>
      </div>

      {/* Default categories */}
      <nav className="flex flex-col gap-1">
        {defaultCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            onMouseEnter={() => setHoveredItem(cat.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
              ${activeCategory === cat.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
          >
            <span className={`transition-all duration-200 ${activeCategory === cat.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
              {cat.icon}
            </span>
            <span className="flex-1 text-left">{cat.name}</span>
            {noteCount[cat.id] !== undefined && (
              <span className="text-xs text-muted-foreground/60">{noteCount[cat.id]}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Clear trash button */}
      {activeCategory === "trash" && (noteCount["trash"] || 0) > 0 && onClearTrash && (
        <button
          onClick={onClearTrash}
          className="mx-3 mt-1 py-1.5 px-3 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all duration-200"
        >
          Limpar Lixeira
        </button>
      )}

      {/* Divider */}
      <div className="h-px bg-border my-3" />

      {/* Custom tags */}
      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</span>
        <button
          onClick={onAddCategory}
          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
        >
          <Plus size={14} />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 overflow-y-auto flex-1">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            onMouseEnter={() => setHoveredItem(cat.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`animate-slide-category flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group
              ${activeCategory === cat.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <Hash
              size={14}
              style={{ color: cat.color || "currentColor" }}
            />
            <span className="flex-1 text-left truncate">{cat.name}</span>
            {noteCount[cat.id] !== undefined && (
              <span className="text-xs text-muted-foreground/60 group-hover:hidden">{noteCount[cat.id]}</span>
            )}
            {onDeleteCategory && hoveredItem === cat.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(cat.id);
                }}
                className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </button>
        ))}
      </nav>

      {/* Sign out and Export button */}
      <div className="flex items-center gap-2 mt-2">
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="flex-1 flex items-center justify-center gap-2 border border-transparent px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            title="Sair"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        )}
        <button
          onClick={() => setExportOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 border border-transparent px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
          title="Backup XLSX"
        >
          <FileSpreadsheet size={16} />
          <span>XLSX</span>
        </button>
      </div>

      {/* Invite button */}
      <button
        onClick={() => setInviteOpen(true)}
        className="mx-1 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all duration-200"
      >
        <UserPlus size={12} />
        <span>Convidar Funcionário</span>
      </button>

      {/* Admin Panel button - only visible to admin */}
      {isAdmin && (
        <button
          onClick={() => navigate("/admin")}
          className="mx-1 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all duration-200"
        >
          <ShieldCheck size={12} />
          <span>Painel Admin</span>
        </button>
      )}

      {/* Plan badge button */}
      {onOpenPricing && (
        <button
          onClick={onOpenPricing}
          className="mx-1 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all duration-200"
        >
          <Star size={12} />
          <span>Ver Planos</span>
        </button>
      )}

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </aside>
  );
};

export default Sidebar;
