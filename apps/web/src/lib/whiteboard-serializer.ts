import type { Editor } from "tldraw";
import type { WhiteboardState, DesignComponent, DesignConnection } from "@ffh/types";

// Custom shape type prefix
const DESIGN_SHAPE_PREFIX = "design-";

// Known design component types
const COMPONENT_LABELS: Record<string, string> = {
  "design-database": "Database",
  "design-cache": "Cache",
  "design-queue": "Message Queue",
  "design-loadbalancer": "Load Balancer",
  "design-gateway": "API Gateway",
  "design-server": "Server/Service",
  "design-cdn": "CDN",
  "design-client": "Client/User",
  "design-storage": "Storage",
  "design-auth": "Auth Service",
};

/**
 * Extract components and connections from tldraw editor state
 */
export function serializeWhiteboard(editor: Editor): WhiteboardState {
  const components: DesignComponent[] = [];
  const connections: DesignConnection[] = [];

  const shapes = editor.getCurrentPageShapes();

  // Build a map of shape id → component info
  const shapeMap = new Map<string, { type: string; label: string }>();

  for (const shape of shapes) {
    // Custom design shapes
    if (shape.type.startsWith(DESIGN_SHAPE_PREFIX)) {
      const props = shape.props as unknown as Record<string, unknown>;
      const label = (props.label as string) || COMPONENT_LABELS[shape.type] || shape.type;
      components.push({
        id: shape.id,
        type: shape.type.replace(DESIGN_SHAPE_PREFIX, ""),
        label,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
      });
      shapeMap.set(shape.id, { type: shape.type, label });
    }
    // Regular geo shapes (rectangles etc.) with text
    else if (shape.type === "geo") {
      const props = shape.props as unknown as Record<string, unknown>;
      const text = (props.text as string) || "";
      if (text.trim()) {
        components.push({
          id: shape.id,
          type: "box",
          label: text.trim(),
          x: Math.round(shape.x),
          y: Math.round(shape.y),
        });
        shapeMap.set(shape.id, { type: "box", label: text.trim() });
      }
    }
    // Text shapes
    else if (shape.type === "text") {
      const props = shape.props as unknown as Record<string, unknown>;
      const text = (props.text as string) || "";
      if (text.trim()) {
        shapeMap.set(shape.id, { type: "text", label: text.trim() });
      }
    }
  }

  // Extract arrows/connections
  for (const shape of shapes) {
    if (shape.type === "arrow") {
      const props = shape.props as unknown as Record<string, unknown>;
      const start = props.start as { boundShapeId?: string } | undefined;
      const end = props.end as { boundShapeId?: string } | undefined;

      const fromId = start?.boundShapeId;
      const toId = end?.boundShapeId;

      if (fromId && toId) {
        const fromInfo = shapeMap.get(fromId);
        const toInfo = shapeMap.get(toId);

        if (fromInfo && toInfo) {
          const arrowLabel = (props.text as string) || "";
          connections.push({
            id: shape.id,
            fromId,
            toId,
            fromLabel: fromInfo.label,
            toLabel: toInfo.label,
            label: arrowLabel.trim() || undefined,
          });
        }
      }
    }
  }

  const textRepresentation = buildTextRepresentation(components, connections);

  return { components, connections, textRepresentation };
}

/**
 * Build a human/LLM-readable text representation of the whiteboard
 */
function buildTextRepresentation(
  components: DesignComponent[],
  connections: DesignConnection[],
): string {
  if (components.length === 0 && connections.length === 0) {
    return "[Whiteboard boş — henüz bileşen eklenmedi]";
  }

  const lines: string[] = [];

  if (components.length > 0) {
    lines.push("Bileşenler:");
    for (const c of components) {
      lines.push(`  - ${c.label} (${c.type})`);
    }
  }

  if (connections.length > 0) {
    lines.push("");
    lines.push("Bağlantılar:");
    for (const conn of connections) {
      const label = conn.label ? ` [${conn.label}]` : "";
      lines.push(`  - ${conn.fromLabel} → ${conn.toLabel}${label}`);
    }
  }

  // Try to infer data flow paths
  if (connections.length >= 2) {
    const paths = inferPaths(connections);
    if (paths.length > 0) {
      lines.push("");
      lines.push("Veri Akışı:");
      for (const path of paths) {
        lines.push(`  ${path}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Try to infer linear paths through the system
 */
function inferPaths(connections: DesignConnection[]): string[] {
  // Build adjacency: fromLabel -> toLabel
  const adj = new Map<string, string[]>();
  const hasIncoming = new Set<string>();

  for (const conn of connections) {
    const existing = adj.get(conn.fromLabel) || [];
    existing.push(conn.toLabel);
    adj.set(conn.fromLabel, existing);
    hasIncoming.add(conn.toLabel);
  }

  // Find root nodes (no incoming edges)
  const roots: string[] = [];
  for (const [from] of adj) {
    if (!hasIncoming.has(from)) {
      roots.push(from);
    }
  }

  const paths: string[] = [];
  for (const root of roots) {
    const path = [root];
    let current = root;
    const visited = new Set<string>([root]);

    while (true) {
      const neighbors = adj.get(current);
      if (!neighbors || neighbors.length === 0) break;
      const next = neighbors.find((n) => !visited.has(n));
      if (!next) break;
      path.push(next);
      visited.add(next);
      current = next;
    }

    if (path.length >= 2) {
      paths.push(path.join(" → "));
    }
  }

  return paths;
}
