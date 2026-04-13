import { Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative w-[68px] h-[34px] rounded-full flex items-center p-1 transition-all duration-500 overflow-hidden ${
        isDark
          ? "bg-[#161a2b] shadow-[inset_0_0_12px_rgba(100,150,255,0.2)] border border-blue-400/20"
          : "bg-[#e4e6ea] shadow-inner border border-transparent"
      }`}
      aria-label="Toggle Theme"
    >
      {/* Magical Stars for Dark Mode */}
      <span className={`absolute top-[6px] left-[12px] w-[2px] h-[2px] bg-white rounded-full transition-opacity duration-500 ${isDark ? "opacity-80 animate-pulse" : "opacity-0"}`} />
      <span className={`absolute top-[20px] left-[20px] w-[3px] h-[3px] bg-white rounded-full transition-opacity duration-500 ${isDark ? "opacity-50 animate-pulse" : "opacity-0"}`} style={{ animationDelay: '0.3s' }} />
      <span className={`absolute bottom-[6px] left-[10px] w-[2px] h-[2px] bg-white rounded-full transition-opacity duration-500 ${isDark ? "opacity-70 animate-pulse" : "opacity-0"}`} style={{ animationDelay: '0.7s' }} />
      <span className={`absolute top-[4px] right-[24px] w-[1px] h-[1px] bg-white rounded-full transition-opacity duration-500 ${isDark ? "opacity-90 animate-pulse" : "opacity-0"}`} style={{ animationDelay: '0.1s' }} />
      
      {/* Light Mode: Right-sided Moon Outline */}
      <div className={`absolute right-0 w-[34px] flex justify-center transition-all duration-500 ${isDark ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}>
        <Moon size={16} strokeWidth={2.5} className="text-slate-600" />
      </div>

      {/* Thumb / Thumb Object */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
          isDark
            ? "translate-x-[34px] bg-transparent"
            : "translate-x-0 bg-white shadow-md"
        }`}
      >
        {/* Dark Mode: The White Glowing Crescent Moon Inside the Thumb Area */}
        <Moon 
           className={`text-white transition-all duration-500 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)] ${isDark ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 -rotate-45"}`}
           size={20}
           fill="currentColor"
           strokeWidth={0}
        />
      </div>
    </button>
  );
}
