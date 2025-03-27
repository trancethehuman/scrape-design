"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Undo2, Redo2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface EditorProps {
  code: string;
  onChange: (value: string) => void;
}

export function Editor({ code, onChange }: EditorProps) {
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: any
  ) => {
    editorRef.current = editor;

    // Focus the editor on mount
    setTimeout(() => {
      editor.focus();
    }, 100);

    // Let Monaco handle keyboard shortcuts natively
    // This is the most reliable way to ensure Cmd+Z works on Mac
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger("keyboard", "undo", null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger("keyboard", "redo", null);
    }
  };

  // Handle clicking on the editor container to focus the editor
  const handleContainerClick = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="h-full border-0 shadow-none overflow-hidden rounded-none flex flex-col">
      <CardContent
        className="p-0 flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden"
        ref={containerRef}
        onClick={handleContainerClick}
      >
        <div className="absolute right-4 top-4 z-20 flex items-center space-x-1 bg-slate-800/80 rounded-md p-1 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-slate-700"
            title="Undo (⌘Z on Mac, Ctrl+Z on Windows)"
          >
            <Undo2 className="h-4 w-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-slate-700"
            title="Redo (⌘Y or ⌘⇧Z on Mac, Ctrl+Y on Windows)"
          >
            <Redo2 className="h-4 w-4" />
            <span className="sr-only">Redo</span>
          </Button>
        </div>
        <MonacoEditor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: true,
            automaticLayout: true,
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
            ariaLabel: "Code Editor",
            quickSuggestions: true,
            cursorBlinking: "smooth",
          }}
        />
      </CardContent>
    </Card>
  );
}
