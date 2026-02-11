import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-surface/50 backdrop-blur-sm px-6 lg:px-8">
      {/* Mobile brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="h-7 w-7 rounded-md bg-amber/20 flex items-center justify-center">
          <span className="text-amber font-display font-bold text-xs">F</span>
        </div>
        <span className="font-display font-bold text-text">Freya</span>
      </div>

      <div className="hidden lg:block" />

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
