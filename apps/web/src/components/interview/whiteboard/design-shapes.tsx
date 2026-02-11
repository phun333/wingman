import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type TLBaseShape,
} from "tldraw";

// ─── Shape Type Definitions ──────────────────────────────

type DesignShapeProps = {
  w: number;
  h: number;
  label: string;
};

// ─── Shape Config ────────────────────────────────────────

interface ShapeConfig {
  type: string;
  icon: string;
  defaultLabel: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
}

const SHAPE_CONFIGS: ShapeConfig[] = [
  {
    type: "design-database",
    icon: "🗄️",
    defaultLabel: "Database",
    bgColor: "rgba(59, 130, 246, 0.08)",
    borderColor: "rgba(59, 130, 246, 0.4)",
    iconBg: "rgba(59, 130, 246, 0.15)",
  },
  {
    type: "design-cache",
    icon: "⚡",
    defaultLabel: "Cache",
    bgColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.4)",
    iconBg: "rgba(245, 158, 11, 0.15)",
  },
  {
    type: "design-queue",
    icon: "📨",
    defaultLabel: "Message Queue",
    bgColor: "rgba(168, 85, 247, 0.08)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    iconBg: "rgba(168, 85, 247, 0.15)",
  },
  {
    type: "design-loadbalancer",
    icon: "⚖️",
    defaultLabel: "Load Balancer",
    bgColor: "rgba(34, 197, 94, 0.08)",
    borderColor: "rgba(34, 197, 94, 0.4)",
    iconBg: "rgba(34, 197, 94, 0.15)",
  },
  {
    type: "design-gateway",
    icon: "🌐",
    defaultLabel: "API Gateway",
    bgColor: "rgba(6, 182, 212, 0.08)",
    borderColor: "rgba(6, 182, 212, 0.4)",
    iconBg: "rgba(6, 182, 212, 0.15)",
  },
  {
    type: "design-server",
    icon: "🖥️",
    defaultLabel: "Service",
    bgColor: "rgba(107, 114, 128, 0.08)",
    borderColor: "rgba(107, 114, 128, 0.4)",
    iconBg: "rgba(107, 114, 128, 0.15)",
  },
  {
    type: "design-cdn",
    icon: "☁️",
    defaultLabel: "CDN",
    bgColor: "rgba(236, 72, 153, 0.08)",
    borderColor: "rgba(236, 72, 153, 0.4)",
    iconBg: "rgba(236, 72, 153, 0.15)",
  },
  {
    type: "design-client",
    icon: "👤",
    defaultLabel: "Client",
    bgColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    iconBg: "rgba(16, 185, 129, 0.15)",
  },
  {
    type: "design-storage",
    icon: "📦",
    defaultLabel: "Storage",
    bgColor: "rgba(249, 115, 22, 0.08)",
    borderColor: "rgba(249, 115, 22, 0.4)",
    iconBg: "rgba(249, 115, 22, 0.15)",
  },
  {
    type: "design-auth",
    icon: "🔒",
    defaultLabel: "Auth Service",
    bgColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.4)",
    iconBg: "rgba(239, 68, 68, 0.15)",
  },
];

// ─── Generic Design Shape Component ──────────────────────

function DesignShapeComponent({
  shape,
  config,
}: {
  shape: TLBaseShape<string, DesignShapeProps>;
  config: ShapeConfig;
}) {
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
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
            fontSize: 20,
          }}
        >
          {config.icon}
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#e0e0e0",
            textAlign: "center",
            lineHeight: 1.2,
            wordBreak: "break-word",
            maxWidth: "100%",
          }}
        >
          {shape.props.label}
        </span>
      </div>
    </HTMLContainer>
  );
}

// ─── Create BaseBoxShapeUtil for each design component type ──

function createDesignShapeUtil(config: ShapeConfig) {
  // We need to use 'any' for the generic because tldraw expects
  // exact shape type literals, not dynamic strings
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
