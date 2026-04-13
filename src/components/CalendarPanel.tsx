import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

interface CalendarEntry {
  entry_date: string;
  content: string;
  color: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const ENTRY_COLORS = [
  { id: "green", bg: "bg-green-500", label: "Verde" },
  { id: "yellow", bg: "bg-yellow-500", label: "Amarelo" },
  { id: "red", bg: "bg-red-500", label: "Vermelho" },
];

const CalendarPanel = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [entries, setEntries] = useState<Record<string, CalendarEntry>>({});
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("green");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Load entries for current month
  useEffect(() => {
    if (!user) return;
    const startDate = dateKey(1);
    const endDate = dateKey(daysInMonth);

    supabase
      .from("calendar_entries")
      .select("entry_date, content, color")
      .gte("entry_date", startDate)
      .lte("entry_date", endDate)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, CalendarEntry> = {};
          data.forEach((e: any) => {
            map[e.entry_date] = e;
          });
          setEntries(map);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar entradas do calendário:", err);
      });
  }, [user, year, month, daysInMonth]);

  const handleDayClick = (day: number) => {
    if (selectedDay === day) {
      setSelectedDay(null);
      return;
    }
    setSelectedDay(day);
    const key = dateKey(day);
    const existing = entries[key];
    setEditContent(existing?.content || "");
    setEditColor(existing?.color || "green");
  };

  const saveEntry = useCallback(async () => {
    if (!user || !selectedDay) return;
    const key = dateKey(selectedDay);

    try {
      console.log("Salvando entrada no calendário:", { key, content: editContent, color: editColor });
      
      const { data, error } = await supabase
        .from("calendar_entries")
        .upsert(
          { 
            user_id: user.id, 
            entry_date: key, 
            content: editContent, 
            color: editColor 
          },
          { onConflict: "user_id,entry_date" }
        )
        .select()
        .single();

      if (error) {
        console.error("Erro do Supabase ao salvar no calendário:", error);
        toast.error("Erro ao salvar anotação: " + (error.message || "Erro desconhecido"));
        return;
      }

      if (data) {
        setEntries((prev) => ({ ...prev, [key]: { entry_date: key, content: editContent, color: editColor } }));
        toast.success("Anotação salva com sucesso!");
      } else {
        // Fallback caso o data venha nulo mas não haja erro (raro no upsert com select)
        setEntries((prev) => ({ ...prev, [key]: { entry_date: key, content: editContent, color: editColor } }));
        toast.info("Anotação processada.");
      }
      
      setSelectedDay(null);
    } catch (err) {
      console.error("Exceção ao salvar no calendário:", err);
      toast.error("Ocorreu um erro inesperado ao salvar.");
    }
  }, [user, selectedDay, editContent, editColor, year, month]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="glass-panel neon-glow p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const key = dateKey(day);
          const entry = entries[key];
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = selectedDay === day;
          const entryColorClass = entry
            ? entry.color === "red" ? "border-red-500" : entry.color === "yellow" ? "border-yellow-500" : "border-green-500"
            : "";

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200
                cal-day-hover
                ${isToday ? "bg-primary/20 text-primary font-bold" : "text-foreground/80 hover:bg-muted/30"}
                ${isSelected ? "cal-day-expanded bg-primary/15 ring-1 ring-primary/40" : ""}
                ${entry ? `border-2 ${entryColorClass}` : "border border-transparent"}
              `}
            >
              {day}
              {entry && entry.content && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Inline editor */}
      {selectedDay && (
        <div className="animate-note-enter flex flex-col gap-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">
            {selectedDay} de {MONTHS[month]}
          </p>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Escreva algo..."
            className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none min-h-[60px] input-glow transition-all"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {ENTRY_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setEditColor(c.id)}
                  className={`w-5 h-5 rounded-full ${c.bg} transition-all duration-200 ${
                    editColor === c.id ? "ring-2 ring-offset-1 ring-offset-background scale-125" : "opacity-60 hover:opacity-100"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Cancelar
              </button>
              <button
                onClick={saveEntry}
                className="text-xs bg-primary/20 text-primary hover:bg-primary/30 rounded-md px-3 py-1 font-medium transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPanel;
