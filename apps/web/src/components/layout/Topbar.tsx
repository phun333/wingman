import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { WingLogo } from "@/components/icons/WingLogo";
import { CommandPalette } from "@/components/CommandPalette";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-surface/50 backdrop-blur-sm px-6 lg:px-8">
      {/* Mobile brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <WingLogo size={28} />
        <span className="font-display font-bold text-text">Wingman</span>
      </div>

      {/* Command Palette trigger — centered on desktop */}
      <div className="hidden lg:flex flex-1 justify-center">
        <CommandPalette />
      </div>

      {/* Mobile: only trigger button */}
      <div className="lg:hidden">
        <CommandPalette />
      </div>

      {/* User */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary hidden sm:block">
          {user?.name}
        </span>
        <button
          onClick={logout}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface-raised border border-border text-text-muted hover:text-text hover:border-amber/30 transition-colors duration-150 cursor-pointer"
          aria-label="Çıkış yap"
          title="Çıkış yap"
        >
          <LogOut size={14} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
