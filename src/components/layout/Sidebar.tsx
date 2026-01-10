import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Upload, 
  Calendar, 
  FolderOpen,
  Settings,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "assistant", label: "Assistente IA", icon: MessageSquare },
  { id: "pdf-reader", label: "Leitor PDF", icon: Upload },
  { id: "cases", label: "Casos", icon: FolderOpen },
  { id: "calendar", label: "Agenda", icon: Calendar },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-sidebar fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Scale className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-sidebar-foreground">LexIA</h1>
            <p className="text-xs text-sidebar-foreground/60">Assistente Jurídico</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "sidebar-nav-item w-full",
              activeTab === item.id && "active"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <button className="sidebar-nav-item w-full">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Configurações</span>
        </button>
      </div>
    </aside>
  );
}
