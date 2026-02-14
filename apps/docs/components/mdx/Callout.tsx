import { Lightbulb, AlertTriangle, Info, CheckCircle2, Flame } from "lucide-react";
import type { ReactNode } from "react";

const variants = {
  tip: {
    icon: Lightbulb,
    border: "border-[#e5a10e]/30",
    bg: "bg-[#e5a10e]/5",
    iconColor: "text-[#e5a10e]",
    title: "İpucu",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    iconColor: "text-orange-400",
    title: "Dikkat",
  },
  info: {
    icon: Info,
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-400",
    title: "Bilgi",
  },
  success: {
    icon: CheckCircle2,
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    iconColor: "text-green-400",
    title: "Başarılı",
  },
  fire: {
    icon: Flame,
    border: "border-[#e5a10e]/30",
    bg: "bg-[#e5a10e]/5",
    iconColor: "text-[#e5a10e]",
    title: "Önemli",
  },
};

interface CalloutProps {
  type?: keyof typeof variants;
  title?: string;
  children: ReactNode;
}

export function Callout({ type = "info", title, children }: CalloutProps) {
  const v = variants[type];
  const Icon = v.icon;

  return (
    <div className={`my-6 rounded-lg border ${v.border} ${v.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={v.iconColor} />
        <span className={`text-sm font-semibold ${v.iconColor}`}>
          {title ?? v.title}
        </span>
      </div>
      <div className="text-sm text-[#ededef]/80 [&>p]:m-0">{children}</div>
    </div>
  );
}
