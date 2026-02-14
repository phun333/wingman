import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Play,
  History,
  TrendingUp,
  Settings,
  Code,
  Briefcase,
  LogOut,
  Search,
  ArrowRight,
  Sparkles,
  Mic,
  FileText,
  Command as CommandIcon,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ⌘K / Ctrl+K toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runAction = useCallback(
    (action: () => void) => {
      setOpen(false);
      action();
    },
    []
  );

  return (
    <>
      {/* Trigger button in Topbar */}
      <button
        onClick={() => setOpen(true)}
        className="
          group flex items-center gap-3 h-10 w-72 lg:w-96 pl-4 pr-3
          rounded-xl border border-border-subtle
          bg-surface-raised/60 backdrop-blur-sm
          text-text-muted text-sm
          hover:border-amber/25 hover:text-text-secondary hover:bg-surface-raised
          transition-all duration-200
          cursor-pointer
        "
      >
        <Search size={14} strokeWidth={2} className="shrink-0 text-text-muted group-hover:text-amber/70 transition-colors" />
        <span className="hidden sm:inline text-[13px]">Ara veya git...</span>
        <kbd
          className="
            hidden sm:inline-flex items-center gap-0.5
            h-5 px-1.5 rounded-md
            bg-bg/80 border border-border
            text-[10px] font-mono font-medium text-text-muted
            group-hover:border-amber/20 group-hover:text-text-secondary
            transition-colors
          "
        >
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Komut Paleti"
        className="command-dialog"
      >
        {/* Search Input */}
        <div className="cmdk-input-wrapper">
          <Search size={16} strokeWidth={2} className="shrink-0 text-amber/60" />
          <Command.Input
            placeholder="Sayfa ara, aksiyon çalıştır..."
            autoFocus
            className="cmdk-input-field"
          />
          <kbd className="cmdk-input-kbd">ESC</kbd>
        </div>

        {/* Results List */}
        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">
            <div className="flex flex-col items-center gap-2">
              <Search size={32} strokeWidth={1.5} className="text-text-muted/40" />
              <span>Sonuç bulunamadı.</span>
              <span className="text-xs text-text-muted/60">Farklı bir arama terimi deneyin</span>
            </div>
          </Command.Empty>

          {/* Navigation */}
          <Command.Group heading="Sayfalar" className="cmdk-group">
            <CommandItem
              icon={<LayoutDashboard size={16} />}
              label="Dashboard"
              description="Ana kontrol paneli"
              keywords={["ana sayfa", "panel", "home", "anasayfa"]}
              shortcut="G D"
              onSelect={() => runAction(() => navigate("/dashboard"))}
            />
            <CommandItem
              icon={<Play size={16} />}
              label="Yeni Mülakat"
              description="Mülakat simülasyonu başlat"
              keywords={["interview", "başlat", "pratik", "yeni", "coding"]}
              shortcut="G N"
              onSelect={() => runAction(() => navigate("/dashboard/interview/new"))}
            />
            <CommandItem
              icon={<Code size={16} />}
              label="Sorular"
              description="LeetCode soru bankası"
              keywords={["leetcode", "problem", "algorithm", "code", "soru"]}
              shortcut="G Q"
              onSelect={() => runAction(() => navigate("/dashboard/questions"))}
            />
            <CommandItem
              icon={<History size={16} />}
              label="Geçmiş"
              description="Mülakat geçmişi ve raporlar"
              keywords={["history", "rapor", "sonuç", "tamamlanan"]}
              shortcut="G H"
              onSelect={() => runAction(() => navigate("/dashboard/history"))}
            />
            <CommandItem
              icon={<TrendingUp size={16} />}
              label="İlerleme"
              description="İstatistik ve gelişim takibi"
              keywords={["progress", "istatistik", "gelişim", "grafik", "chart"]}
              shortcut="G P"
              onSelect={() => runAction(() => navigate("/dashboard/progress"))}
            />
            <CommandItem
              icon={<Briefcase size={16} />}
              label="İş İlanları"
              description="Eşleşen iş fırsatları"
              keywords={["jobs", "iş", "ilan", "kariyer", "pozisyon"]}
              shortcut="G J"
              onSelect={() => runAction(() => navigate("/dashboard/jobs"))}
            />
            <CommandItem
              icon={<Settings size={16} />}
              label="Profil & Ayarlar"
              description="Hesap ve tercihler"
              keywords={["profil", "ayar", "hesap", "özgeçmiş", "cv"]}
              shortcut="G S"
              onSelect={() => runAction(() => navigate("/dashboard/settings"))}
            />
          </Command.Group>

          <Command.Separator className="cmdk-separator" />

          {/* Quick Actions */}
          <Command.Group heading="Hızlı Aksiyonlar" className="cmdk-group">
            <CommandItem
              icon={<Mic size={16} />}
              label="Live Coding Mülakatı Başlat"
              description="Sesli mülakat simülasyonu"
              keywords={["live", "coding", "mülakat", "sesli", "voice"]}
              accent
              onSelect={() =>
                runAction(() => navigate("/dashboard/interview/new"))
              }
            />
            <CommandItem
              icon={<Sparkles size={16} />}
              label="System Design Mülakatı"
              description="Mimari tasarım egzersizi"
              keywords={["system", "design", "mimari", "architecture"]}
              accent
              onSelect={() =>
                runAction(() => navigate("/dashboard/interview/new"))
              }
            />
            <CommandItem
              icon={<FileText size={16} />}
              label="CV Yükle"
              description="Özgeçmişini güncelle"
              keywords={["resume", "cv", "upload", "yükle", "özgeçmiş"]}
              onSelect={() =>
                runAction(() => navigate("/dashboard/settings"))
              }
            />
          </Command.Group>

          <Command.Separator className="cmdk-separator" />

          {/* Account */}
          <Command.Group heading="Hesap" className="cmdk-group">
            <CommandItem
              icon={<LogOut size={16} />}
              label="Çıkış Yap"
              description="Oturumu sonlandır"
              keywords={["logout", "çıkış", "oturum"]}
              danger
              onSelect={() => runAction(() => logout())}
            />
          </Command.Group>
        </Command.List>

        {/* Footer */}
        <div className="cmdk-footer">
          <div className="flex items-center gap-3">
            <span className="cmdk-footer-hint">
              <kbd>↑↓</kbd> gezin
            </span>
            <span className="cmdk-footer-hint">
              <kbd>↵</kbd> seç
            </span>
            <span className="cmdk-footer-hint">
              <kbd>esc</kbd> kapat
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted/40">
            <CommandIcon size={12} />
            <span className="text-[10px] font-medium tracking-wider uppercase">Wingman</span>
          </div>
        </div>
      </Command.Dialog>
    </>
  );
}

// ─── Command Item ──────────────────────────────────────────

interface CommandItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  keywords?: string[];
  shortcut?: string;
  accent?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

function CommandItem({
  icon,
  label,
  description,
  keywords,
  shortcut,
  accent,
  danger,
  onSelect,
}: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      keywords={keywords}
      className={`cmdk-item ${accent ? "cmdk-item-accent" : ""} ${danger ? "cmdk-item-danger" : ""}`}
      value={label}
    >
      <div className={`cmdk-item-icon ${accent ? "cmdk-item-icon-accent" : ""} ${danger ? "cmdk-item-icon-danger" : ""}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0 min-w-0 flex-1">
        <span className="cmdk-item-label">{label}</span>
        {description && (
          <span className="cmdk-item-description">{description}</span>
        )}
      </div>
      {shortcut && (
        <div className="cmdk-item-shortcut">
          {shortcut.split(" ").map((key) => (
            <kbd key={key}>{key}</kbd>
          ))}
        </div>
      )}
      <ArrowRight size={12} className="cmdk-item-arrow" />
    </Command.Item>
  );
}
