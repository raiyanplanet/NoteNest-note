import { User, FileText, LogOut, Sun, Moon } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
// import ThemeSwitcher from "./ThemeSwitcher";

interface SidebarProps {
  activeTab: "notes" | "profile";
  setActiveTab: (tab: "notes" | "profile") => void;
  onLogout: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, theme, setTheme }: SidebarProps) {
  return (
    <aside className="flex flex-col h-full w-20 bg-zinc-900 border-r border-zinc-800 shadow-xl fixed left-0 top-0 z-40">
      {/* Logo/Title */}
      <div className="flex flex-col items-center py-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-2 mb-2">
          <FileText className="h-7 w-7 text-white" />
        </div>
        <span className="text-xs text-zinc-200 font-bold tracking-wide">Notenest</span>
      </div>
      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-4 mt-8">
        <button
          className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg ${activeTab === "notes" ? "bg-zinc-800 text-blue-400" : "text-zinc-400 hover:text-white"}`}
          onClick={() => setActiveTab("notes")}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs">Notes</span>
        </button>
        <button
          className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg ${activeTab === "profile" ? "bg-zinc-800 text-blue-400" : "text-zinc-400 hover:text-white"}`}
          onClick={() => setActiveTab("profile")}
        >
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </button>
        <button
          className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-zinc-400 hover:text-red-400 mt-8"
          onClick={onLogout}
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs">Logout</span>
        </button>
      </nav>
      {/* Theme toggle at the bottom */}
      <div className="mt-auto mb-6 flex flex-col items-center gap-2">
        <Switch.Root
          className="w-12 h-6 bg-zinc-800 rounded-full relative shadow-inner outline-none cursor-pointer border border-zinc-700"
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          id="theme-toggle"
        >
          <Switch.Thumb
            className="block w-5 h-5 bg-white rounded-full shadow absolute top-0.5 left-0.5 transition-transform duration-200 will-change-transform"
            style={{ transform: theme === "dark" ? "translateX(24px)" : "translateX(0px)" }}
          />
        </Switch.Root>
        <label htmlFor="theme-toggle" className="flex items-center gap-1 text-xs text-zinc-400 select-none">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === "dark" ? "Dark" : "Light"}
        </label>
      </div>
      {/* Dark mode toggle at the bottom */}
      {/* <div className="mt-auto mb-6 flex justify-center">
        <ThemeSwitcher />
      </div> */}
    </aside>
  );
} 