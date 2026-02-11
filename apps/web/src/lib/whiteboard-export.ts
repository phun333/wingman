import type { Editor } from "tldraw";

/**
 * Export whiteboard canvas as SVG string
 */
export async function exportWhiteboardSvg(editor: Editor): Promise<string | null> {
  const shapeIds = editor.getCurrentPageShapeIds();
  if (shapeIds.size === 0) return null;

  const shapes = [...shapeIds];
  const result = await editor.getSvgString(shapes, {
    padding: 32,
    background: true,
  });

  return result?.svg ?? null;
}

/**
 * Export whiteboard canvas as PNG Blob
 */
export async function exportWhiteboardPng(editor: Editor): Promise<Blob | null> {
  const svgString = await exportWhiteboardSvg(editor);
  if (!svgString) return null;

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Use 2x for retina quality
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Export whiteboard as PNG and trigger download
 */
export async function downloadWhiteboardPng(editor: Editor, filename = "system-design.png"): Promise<void> {
  const blob = await exportWhiteboardPng(editor);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export whiteboard as SVG and trigger download
 */
export async function downloadWhiteboardSvg(editor: Editor, filename = "system-design.svg"): Promise<void> {
  const svgString = await exportWhiteboardSvg(editor);
  if (!svgString) return;

  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export whiteboard as PNG data URL (for embedding in reports)
 */
export async function exportWhiteboardDataUrl(editor: Editor): Promise<string | null> {
  const blob = await exportWhiteboardPng(editor);
  if (!blob) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}
