import { type Editor, createShapeId } from "tldraw";
import { SHAPE_CONFIGS } from "./design-shapes";
import { useState } from "react";

interface ComponentPaletteProps {
  editor: Editor | null;
}

const CATEGORIES = [
  {
    name: "Ağ",
    types: ["design-loadbalancer", "design-gateway", "design-cdn"],
  },
  {
    name: "Servisler",
    types: ["design-server", "design-auth", "design-client"],
  },
  {
    name: "Veri",
    types: ["design-database", "design-cache", "design-storage"],
  },
  {
    name: "Mesajlaşma",
    types: ["design-queue"],
  },
];

export function ComponentPalette({ editor }: ComponentPaletteProps) {
  const [collapsed, setCollapsed] = useState(false);

  function addComponent(shapeType: string) {
    if (!editor) return;

    const config = SHAPE_CONFIGS.find((c) => c.type === shapeType);
    if (!config) return;

    // Get center of current viewport
    const viewportCenter = editor.getViewportScreenCenter();
    const pagePoint = editor.screenToPage(viewportCenter);

    // Add some randomness so shapes don't stack exactly
    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 100;

    const id = createShapeId();

    editor.createShape({
      id,
      type: shapeType as any,
      x: pagePoint.x + offsetX - 70,
      y: pagePoint.y + offsetY - 50,
      props: {
        w: 140,
        h: 100,
        label: config.defaultLabel,
      },
    });

    // Select the new shape
    editor.select(id);
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-3 left-3 z-50 flex items-center gap-1.5 rounded-lg bg-surface/95 backdrop-blur-sm border border-border px-3 py-2 text-xs text-text-secondary hover:text-text hover:border-amber/40 transition-all cursor-pointer shadow-lg"
        title="Bileşen Paletini Aç"
      >
        <span>🧩</span>
        <span>Bileşenler</span>
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-3 z-50 w-48 rounded-xl bg-surface/95 backdrop-blur-sm border border-border shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Bileşenler
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-text-muted hover:text-text text-sm cursor-pointer p-0.5"
          title="Küçült"
        >
          ✕
        </button>
      </div>

      {/* Categories */}
      <div className="p-2 max-h-[70vh] overflow-y-auto space-y-3">
        {CATEGORIES.map((category) => (
          <div key={category.name}>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider px-1 mb-1.5">
              {category.name}
            </p>
            <div className="space-y-1">
              {category.types.map((shapeType) => {
                const config = SHAPE_CONFIGS.find((c) => c.type === shapeType);
                if (!config) return null;
                return (
                  <button
                    key={shapeType}
                    onClick={() => addComponent(shapeType)}
                    className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer hover:bg-surface-raised group border border-transparent hover:border-border-subtle"
                  >
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: config.iconBg }}
                    >
                      {config.icon}
                    </span>
                    <span className="text-xs text-text-secondary group-hover:text-text font-medium truncate">
                      {config.defaultLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer tip */}
      <div className="px-3 py-2 border-t border-border-subtle">
        <p className="text-[10px] text-text-muted leading-relaxed">
          Tıklayarak ekle, ok aracıyla bağla
        </p>
      </div>
    </div>
  );
}
