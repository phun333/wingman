import type { ReactNode } from "react";
import {
  Mic, Code2, Waypoints, Phone, Dumbbell, BarChart3, Brain, Zap, Target,
  Flame, Trophy, Clock, CheckCircle2, AlertTriangle, Lightbulb, Search,
  Volume2, MessageSquare, Shield, FileCode, Sparkles, Terminal, Keyboard,
  Settings, User, Lock, Globe, Bell, TrendingUp, History, Layers, Database,
  Star, BookOpen, FileText, Calendar, Briefcase, Building2, ListChecks,
  Gauge, Award, Bug, Headphones, Activity, Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  mic: Mic, code: Code2, waypoints: Waypoints, phone: Phone, dumbbell: Dumbbell,
  chart: BarChart3, brain: Brain, zap: Zap, target: Target, flame: Flame,
  trophy: Trophy, clock: Clock, check: CheckCircle2, warning: AlertTriangle,
  tip: Lightbulb, search: Search, volume: Volume2, chat: MessageSquare,
  shield: Shield, "file-code": FileCode, sparkles: Sparkles, terminal: Terminal,
  keyboard: Keyboard, settings: Settings, user: User, lock: Lock, globe: Globe,
  bell: Bell, trending: TrendingUp, history: History, layers: Layers,
  database: Database, star: Star, book: BookOpen, file: FileText,
  calendar: Calendar, briefcase: Briefcase, building: Building2,
  "list-checks": ListChecks, gauge: Gauge, award: Award, bug: Bug,
  headphones: Headphones, activity: Activity, monitor: Monitor,
};

interface FeatureCardProps {
  icon: string;
  title: string;
  children: ReactNode;
}

export function FeatureCard({ icon, title, children }: FeatureCardProps) {
  const Icon = iconMap[icon] ?? Zap;
  return (
    <div className="rounded-xl border border-[#27272f] bg-[#0f0f14] p-5 hover:border-[#e5a10e]/30 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#e5a10e]/10 border border-[#e5a10e]/20">
          <Icon size={18} className="text-[#e5a10e]" />
        </div>
        <h3 className="text-base font-semibold text-[#ededef] !m-0">{title}</h3>
      </div>
      <div className="text-sm text-[#8b8b96] [&>p]:m-0">{children}</div>
    </div>
  );
}
