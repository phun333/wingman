import { useState, useRef, useEffect, useCallback } from "react";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  useEditor,
  type TLBaseShape,
} from "tldraw";
import {
  Database,
  Zap,
  Mail,
  Scale,
  Globe,
  Server,
  Cloud,
  User,
  HardDrive,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Shape Type Definitions ──────────────────────────────

type DesignShapeProps = {
  w: number;
  h: number;
  label: string;
};

// ─── Shape Config ────────────────────────────────────────

interface ShapeConfig {
  type: string;
  icon: LucideIcon;
  defaultLabel: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}

const SHAPE_CONFIGS: ShapeConfig[] = [
  {
    type: "design-database",
    icon: Database,
    defaultLabel: "Database",
    bgColor: "rgba(59, 130, 246, 0.08)",
    borderColor: "rgba(59, 130, 246, 0.4)",
    iconBg: "rgba(59, 130, 246, 0.15)",
    iconColor: "#3b82f6",
  },
  {
    type: "design-cache",
    icon: Zap,
    defaultLabel: "Cache",
    bgColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.4)",
    iconBg: "rgba(245, 158, 11, 0.15)",
    iconColor: "#f59e0b",
  },
  {
    type: "design-queue",
    icon: Mail,
    defaultLabel: "Message Queue",
    bgColor: "rgba(168, 85, 247, 0.08)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    iconBg: "rgba(168, 85, 247, 0.15)",
    iconColor: "#a855f7",
  },
  {
    type: "design-loadbalancer",
    icon: Scale,
    defaultLabel: "Load Balancer",
    bgColor: "rgba(34, 197, 94, 0.08)",
    borderColor: "rgba(34, 197, 94, 0.4)",
    iconBg: "rgba(34, 197, 94, 0.15)",
    iconColor: "#22c55e",
  },
  {
    type: "design-gateway",
    icon: Globe,
    defaultLabel: "API Gateway",
    bgColor: "rgba(6, 182, 212, 0.08)",
    borderColor: "rgba(6, 182, 212, 0.4)",
    iconBg: "rgba(6, 182, 212, 0.15)",
    iconColor: "#06b6d4",
  },
  {
    type: "design-server",
    icon: Server,
    defaultLabel: "Service",
    bgColor: "rgba(107, 114, 128, 0.08)",
    borderColor: "rgba(107, 114, 128, 0.4)",
    iconBg: "rgba(107, 114, 128, 0.15)",
    iconColor: "#6b7280",
  },
  {
    type: "design-cdn",
    icon: Cloud,
    defaultLabel: "CDN",
    bgColor: "rgba(236, 72, 153, 0.08)",
    borderColor: "rgba(236, 72, 153, 0.4)",
    iconBg: "rgba(236, 72, 153, 0.15)",
    iconColor: "#ec4899",
  },
  {
    type: "design-client",
    icon: User,
    defaultLabel: "Client",
    bgColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    iconBg: "rgba(16, 185, 129, 0.15)",
    iconColor: "#10b981",
  },
  {
    type: "design-storage",
    icon: HardDrive,
    defaultLabel: "Storage",
    bgColor: "rgba(249, 115, 22, 0.08)",
    borderColor: "rgba(249, 115, 22, 0.4)",
    iconBg: "rgba(249, 115, 22, 0.15)",
    iconColor: "#f97316",
  },
  {
    type: "design-auth",
    icon: Lock,
    defaultLabel: "Auth Service",
    bgColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    iconBg: "rgba(239, 68, 68, 0.15)",
    iconColor: "#ef4444",
  },
];

// ─── Inline Editable Label Component ─────────────────────

function InlineEditableLabel({
  shapeId,
  label,
}: {
  shapeId: string;
  label: string;
}) {
  const editor = useEditor();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(label);
  }, [label]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== label) {
      (editor as any).updateShape({
        id: shapeId,
        type: (editor as any).getShape(shapeId)?.type,
        props: { label: trimmed },
      });
    } else {
      setValue(label);
    }
  }, [editor, shapeId, label, value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") {
            setValue(label);
            setEditing(false);
          }
          e.stopPropagation();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#e0e0e0",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: "100%",
          width: "100%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 6,
          padding: "2px 6px",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    );
  }

  return (
    <span
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#e0e0e0",
        textAlign: "center",
        lineHeight: 1.2,
        wordBreak: "break-word",
        maxWidth: "100%",
        cursor: "text",
      }}
      title="Çift tıkla düzenle"
    >
      {label}
    </span>
  );
}

// ─── Generic Design Shape Component ──────────────────────

function DesignShapeComponent({
  shape,
  config,
}: {
  shape: TLBaseShape<string, DesignShapeProps>;
  config: ShapeConfig;
}) {
  const IconComponent = config.icon;

  return (
    <HTMLContainer
      id={shape.id}
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: "all",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: config.bgColor,
          border: `2px solid ${config.borderColor}`,
          borderRadius: 12,
          padding: "8px 12px",
          cursor: "pointer",
          userSelect: "none",
          fontFamily:
            '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: config.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent size={20} color={config.iconColor} strokeWidth={1.8} />
        </div>
        <InlineEditableLabel shapeId={shape.id} label={shape.props.label} />
      </div>
    </HTMLContainer>
  );
}

// ─── Create BaseBoxShapeUtil for each design component type ──

function createDesignShapeUtil(config: ShapeConfig) {
  const Util = class extends BaseBoxShapeUtil<any> {
    static override type = config.type as any;

    override getDefaultProps() {
      return {
        w: 140,
        h: 100,
        label: config.defaultLabel,
      };
    }

    override component(shape: any) {
      return <DesignShapeComponent shape={shape} config={config} />;
    }

    override indicator(shape: any) {
      return (
        <rect
          width={shape.props.w}
          height={shape.props.h}
          rx={12}
          ry={12}
        />
      );
    }
  };

  return Util;
}

// ─── Export all shape utils ──────────────────────────────

export const designShapeUtils = SHAPE_CONFIGS.map((config) =>
  createDesignShapeUtil(config),
);

export { SHAPE_CONFIGS };
export type { ShapeConfig };
