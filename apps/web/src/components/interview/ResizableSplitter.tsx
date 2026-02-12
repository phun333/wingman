import { useCallback, useRef, useState, type ReactNode } from "react";

interface ResizableSplitterProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  direction?: "horizontal" | "vertical";
}

export function ResizableSplitter({
  left,
  right,
  defaultLeftPercent = 40,
  minLeftPercent = 20,
  maxLeftPercent = 70,
  direction = "horizontal",
}: ResizableSplitterProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    const getPos = (ev: MouseEvent | TouchEvent) => {
      if ("touches" in ev) {
        return direction === "horizontal" ? ev.touches[0]!.clientX : ev.touches[0]!.clientY;
      }
      return direction === "horizontal" ? ev.clientX : ev.clientY;
    };

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const pos = getPos(ev);
      let percent: number;

      if (direction === "horizontal") {
        percent = ((pos - rect.left) / rect.width) * 100;
      } else {
        percent = ((pos - rect.top) / rect.height) * 100;
      }

      percent = Math.max(minLeftPercent, Math.min(maxLeftPercent, percent));
      setLeftPercent(percent);
    };

    const handleEnd = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);
  }, [direction, minLeftPercent, maxLeftPercent]);

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? "flex-row" : "flex-col"} h-full w-full overflow-hidden`}
    >
      {/* Left / Top panel */}
      <div
        style={{ [isHorizontal ? "width" : "height"]: `${leftPercent}%` }}
        className="overflow-hidden"
      >
        {left}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className={`
          flex-shrink-0 bg-border-subtle hover:bg-amber/30 active:bg-amber/40
          transition-colors duration-150 group flex items-center justify-center
          ${
            isHorizontal
              ? "w-1.5 cursor-col-resize"
              : "h-1.5 cursor-row-resize"
          }
        `}
      />

      {/* Right / Bottom panel */}
      <div
        style={{ [isHorizontal ? "width" : "height"]: `${100 - leftPercent}%` }}
        className="overflow-hidden"
      >
        {right}
      </div>
    </div>
  );
}
