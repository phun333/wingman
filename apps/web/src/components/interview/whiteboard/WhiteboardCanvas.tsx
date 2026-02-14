import { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Tldraw, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import { designShapeUtils } from "./design-shapes";
import { ComponentPalette } from "./ComponentPalette";
import { serializeWhiteboard } from "@/lib/whiteboard-serializer";
import type { WhiteboardState } from "@ffh/types";

interface WhiteboardCanvasProps {
  onStateChange: (state: WhiteboardState) => void;
  onEditorReady?: (editor: Editor) => void;
}

export interface WhiteboardCanvasHandle {
  /** Immediately serialize & emit the current whiteboard state (skip debounce) */
  flush: () => void;
}

export const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, WhiteboardCanvasProps>(
  function WhiteboardCanvas({ onStateChange, onEditorReady }, ref) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<string>("");
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const emitNow = useCallback(() => {
    if (!editor) return;
    const state = serializeWhiteboard(editor);
    const stateStr = JSON.stringify(state);
    if (stateStr !== lastStateRef.current) {
      lastStateRef.current = stateStr;
      console.log(`[Whiteboard] Emitting state: ${state.components.length} components, ${state.connections.length} connections`);
      onStateChangeRef.current(state);
    }
  }, [editor]);

  // Expose flush() to parent via ref
  useImperativeHandle(ref, () => ({ flush: emitNow }), [emitNow]);

  const handleMount = useCallback(
    (editorInstance: Editor) => {
      setEditor(editorInstance);
      onEditorReady?.(editorInstance);
    },
    [onEditorReady],
  );

  // Debounced serialization on store changes
  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(emitNow, 800); // 800ms debounce
    };

    // Listen to ALL store changes (not just "user" source)
    // so programmatic createShape() from ComponentPalette is captured too
    const unsub = editor.store.listen(handleChange, {
      scope: "document",
    });

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor, emitNow]);

  return (
    <div className="relative w-full h-full whiteboard-container">
      <ComponentPalette editor={editor} />
      <Tldraw
        onMount={handleMount}
        shapeUtils={designShapeUtils}
        inferDarkMode
      />
    </div>
  );
});
