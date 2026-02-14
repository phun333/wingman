import { NavLink } from "react-router-dom";
import { LayoutDashboard, Play, History, TrendingUp, Settings, Code, Briefcase, BookOpen, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WingLogo } from "@/components/icons/WingLogo";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  id?: string;
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true, id: "tour-nav-dashboard" },
  { to: "/dashboard/interview/new", label: "Yeni Mülakat", icon: Play, id: "tour-nav-new-interview" },
  { to: "/dashboard/questions", label: "Sorular", icon: Code, id: "tour-nav-questions" },
  { to: "/dashboard/history", label: "Geçmiş", icon: History, id: "tour-nav-history" },
  { to: "/dashboard/progress", label: "İlerleme", icon: TrendingUp, id: "tour-nav-progress" },
  { to: "/dashboard/explore", label: "İş Keşfet", icon: Compass, id: "tour-nav-explore" },
  { to: "/dashboard/jobs", label: "İş İlanları", icon: Briefcase, id: "tour-nav-jobs" },
  { to: "/dashboard/settings", label: "Profil & Ayarlar", icon: Settings, id: "tour-nav-settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border-subtle bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border-subtle">
        <WingLogo size={32} className="glow-amber-sm" />
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
            id={item.id}
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
      <div className="px-4 py-4 border-t border-border-subtle flex flex-col gap-2">
        <a
          href="/docs"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-amber hover:bg-amber/5 transition-colors duration-150"
        >
          <BookOpen size={16} strokeWidth={2} aria-hidden="true" />
          Dokümantasyon
        </a>
        <p className="text-xs text-text-muted text-center">
          Wingman AI &middot; v0.1
        </p>
      </div>
    </aside>
  );
}
