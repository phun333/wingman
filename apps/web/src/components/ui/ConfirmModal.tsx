import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";
import { Button } from "./Button";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: typeof Trash2;
    iconBg: string;
    iconColor: string;
    accentLine: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-danger/10 border-danger/20",
    iconColor: "text-danger",
    accentLine: "from-transparent via-danger/50 to-transparent",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber/10 border-amber/20",
    iconColor: "text-amber",
    accentLine: "from-transparent via-amber/50 to-transparent",
  },
  info: {
    icon: Info,
    iconBg: "bg-info/10 border-info/20",
    iconColor: "text-info",
    accentLine: "from-transparent via-info/50 to-transparent",
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Onayla",
  cancelText = "Vazgeç",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button when modal opens
  useEffect(() => {
    if (open) {
      // Small delay so AnimatePresence has mounted the DOM node
      const id = setTimeout(() => cancelBtnRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            className="relative w-full max-w-sm rounded-xl border border-border-subtle bg-surface shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Accent top line */}
            <div
              className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${config.accentLine}`}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="px-6 pt-7 pb-5 flex flex-col items-center text-center">
              <div
                className={`h-12 w-12 rounded-xl border flex items-center justify-center mb-4 ${config.iconBg}`}
              >
                <Icon size={22} className={config.iconColor} />
              </div>

              <h3
                id="confirm-modal-title"
                className="font-display text-base font-semibold text-text"
              >
                {title}
              </h3>

              {description && (
                <p
                  id="confirm-modal-desc"
                  className="mt-2 text-sm text-text-secondary leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex items-center gap-3">
              <Button
                ref={cancelBtnRef}
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                {cancelText}
              </Button>
              <Button
                ref={confirmBtnRef}
                variant={variant === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={handleConfirm}
                loading={loading}
                className="flex-1"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
