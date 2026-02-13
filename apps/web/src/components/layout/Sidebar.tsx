import { NavLink } from "react-router-dom";
import { LayoutDashboard, Play, History, TrendingUp, Settings, Code, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/interview/new", label: "Yeni Mülakat", icon: Play },
  { to: "/dashboard/questions", label: "Sorular", icon: Code },
  { to: "/dashboard/history", label: "Geçmiş", icon: History },
  { to: "/dashboard/progress", label: "İlerleme", icon: TrendingUp },
  { to: "/dashboard/jobs", label: "İş İlanları", icon: Briefcase },
  { to: "/dashboard/settings", label: "Profil & Ayarlar", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border-subtle bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border-subtle">
        <div className="h-8 w-8 rounded-lg bg-amber/20 flex items-center justify-center glow-amber-sm">
          <span className="text-amber font-display font-bold text-sm">W</span>
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-text">
          Wingman
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `
              flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
              transition-colors duration-150
              ${
                isActive
                  ? "bg-amber/10 text-amber"
                  : "text-text-secondary hover:text-text hover:bg-surface-raised"
              }
            `}
          >
            <item.icon size={16} strokeWidth={2} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border-subtle">
        <p className="text-xs text-text-muted text-center">
          Wingman AI &middot; v0.1
        </p>
      </div>
    </aside>
  );
}
