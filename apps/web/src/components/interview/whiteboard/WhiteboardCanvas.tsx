import { useCallback, useEffect, useRef, useState } from "react";
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

export function WhiteboardCanvas({ onStateChange, onEditorReady }: WhiteboardCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<string>("");

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
      debounceRef.current = setTimeout(() => {
        const state = serializeWhiteboard(editor);
        const stateStr = JSON.stringify(state);

        // Only emit if changed
        if (stateStr !== lastStateRef.current) {
          lastStateRef.current = stateStr;
          onStateChange(state);
        }
      }, 3000); // 3 second debounce
    };

    // Listen to store changes
    const unsub = editor.store.listen(handleChange, {
      source: "user",
      scope: "document",
    });

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor, onStateChange]);

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
}
