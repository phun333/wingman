import { Circle } from "lucide-react";

interface StatusIndicatorProps {
  items: { color: string; label: string; description: string }[];
}

export function StatusIndicator({ items }: StatusIndicatorProps) {
  return (
    <div className="my-4 space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-lg border border-[#27272f] bg-[#0f0f14] px-4 py-2.5"
        >
          <Circle
            size={12}
            fill={item.color}
            stroke={item.color}
            className="shrink-0"
          />
          <span className="text-sm font-medium text-[#ededef] min-w-[100px]">
            {item.label}
          </span>
          <span className="text-sm text-[#8b8b96]">{item.description}</span>
        </div>
      ))}
    </div>
  );
}
