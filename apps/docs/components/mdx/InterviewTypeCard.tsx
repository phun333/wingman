import type { ReactNode } from "react";
import { Code2, Waypoints, Phone, Dumbbell, Mic, Brain } from "lucide-react";

const iconMap = {
  code: Code2,
  "system-design": Waypoints,
  phone: Phone,
  practice: Dumbbell,
  mic: Mic,
  brain: Brain,
};

const colorMap = {
  amber: {
    bg: "bg-[#e5a10e]/8",
    border: "border-[#e5a10e]/25",
    iconBg: "bg-[#e5a10e]/15",
    iconBorder: "border-[#e5a10e]/30",
    text: "text-[#e5a10e]",
  },
  blue: {
    bg: "bg-blue-500/8",
    border: "border-blue-500/25",
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/30",
    text: "text-blue-400",
  },
  green: {
    bg: "bg-green-500/8",
    border: "border-green-500/25",
    iconBg: "bg-green-500/15",
    iconBorder: "border-green-500/30",
    text: "text-green-400",
  },
  purple: {
    bg: "bg-purple-500/8",
    border: "border-purple-500/25",
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/30",
    text: "text-purple-400",
  },
};

interface InterviewTypeCardProps {
  icon: keyof typeof iconMap;
  title: string;
  color: keyof typeof colorMap;
  children: ReactNode;
}

export function InterviewTypeCard({
  icon,
  title,
  color,
  children,
}: InterviewTypeCardProps) {
  const c = colorMap[color];
  const Icon = iconMap[icon];
  return (
    <div
      className={`rounded-xl border ${c.border} ${c.bg} p-5 hover:scale-[1.01] transition-transform duration-200`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.iconBg} border ${c.iconBorder}`}
        >
          <Icon size={20} className={c.text} />
        </div>
        <h3 className={`text-lg font-bold ${c.text} !m-0`}>{title}</h3>
      </div>
      <div className="text-sm text-[#ededef]/70 [&>p]:m-0 [&>ul]:mt-2 [&>ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
