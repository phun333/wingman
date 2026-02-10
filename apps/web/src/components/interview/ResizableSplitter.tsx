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

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let percent: number;

      if (direction === "horizontal") {
        percent = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        percent = ((e.clientY - rect.top) / rect.height) * 100;
      }

      percent = Math.max(minLeftPercent, Math.min(maxLeftPercent, percent));
      setLeftPercent(percent);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
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
        onMouseDown={handleMouseDown}
        className={`
          flex-shrink-0 bg-border-subtle hover:bg-amber/30 transition-colors duration-150
          ${
            isHorizontal
              ? "w-1 cursor-col-resize hover:w-1"
              : "h-1 cursor-row-resize hover:h-1"
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
