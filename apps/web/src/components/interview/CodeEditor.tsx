import { useCallback, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { CodeLanguage } from "@ffh/types";

interface CodeEditorProps {
  language: CodeLanguage;
  value: string;
  onChange: (value: string) => void;
}

const monacoLanguageMap: Record<CodeLanguage, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
};

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure editor theme
    monaco.editor.defineTheme("freya-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "55555f", fontStyle: "italic" },
        { token: "keyword", foreground: "e5a10e" },
        { token: "string", foreground: "22c55e" },
        { token: "number", foreground: "3b82f6" },
        { token: "type", foreground: "f5c842" },
      ],
      colors: {
        "editor.background": "#0f0f14",
        "editor.foreground": "#ededef",
        "editor.lineHighlightBackground": "#16161d",
        "editor.selectionBackground": "#e5a10e30",
        "editorCursor.foreground": "#e5a10e",
        "editorLineNumber.foreground": "#55555f",
        "editorLineNumber.activeForeground": "#8b8b96",
        "editor.inactiveSelectionBackground": "#1c1c25",
        "editorWidget.background": "#0f0f14",
        "editorWidget.border": "#27272f",
        "editorSuggestWidget.background": "#16161d",
        "editorSuggestWidget.border": "#27272f",
        "editorSuggestWidget.selectedBackground": "#1c1c25",
        "scrollbarSlider.background": "#27272f80",
        "scrollbarSlider.hoverBackground": "#55555f80",
      },
    });

    monaco.editor.setTheme("freya-dark");

    // Focus editor
    editor.focus();
  }, []);

  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange(value ?? "");
    },
    [onChange],
  );

  return (
    <Editor
      language={monacoLanguageMap[language]}
      value={value}
      onChange={handleChange}
      onMount={handleMount}
      theme="freya-dark"
      options={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        lineHeight: 22,
        lineNumbers: "on",
        minimap: { enabled: false },
        wordWrap: "on",
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: "gutter",
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        tabSize: 2,
        formatOnPaste: true,
        suggestOnTriggerCharacters: true,
      }}
    />
  );
}
