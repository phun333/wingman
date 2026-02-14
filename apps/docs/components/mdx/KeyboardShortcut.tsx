interface KeyboardShortcutProps {
  keys: string;
}

export function Kbd({ keys }: KeyboardShortcutProps) {
  const parts = keys.split("+").map((k) => k.trim());
  return (
    <span className="inline-flex items-center gap-0.5">
      {parts.map((key, i) => (
        <span key={i} className="inline-flex items-center">
          {i > 0 && <span className="text-[#55555f] mx-0.5 text-xs">+</span>}
          <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-md bg-[#16161d] border border-[#27272f] text-[11px] font-mono font-medium text-[#8b8b96] shadow-sm">
            {key}
          </kbd>
        </span>
      ))}
    </span>
  );
}
