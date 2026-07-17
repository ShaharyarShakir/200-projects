import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import * as Y from "yjs";
import { MathBlock } from "../extensions/math";
import { MermaidBlock } from "../extensions/mermaid";
import { SlashCommands } from "../extensions/slash-commands";
import { slashSuggestion } from "../extensions/slash-commands/menu";
import { CustomCodeBlock } from "../extensions/code-block";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { EditorToolbar } from "../toolbar";
import { EditorBubbleMenu } from "../bubble-menu";
import { EditorFloatingMenu } from "../floating-menu";
import { exportToMarkdown, importFromMarkdown } from "../markdown";
import { Sparkles } from "lucide-react";

import "./style.css";


interface CollaborativeEditorProps {
  ydoc: Y.Doc | null;
  provider: any; // HocuspocusProvider
  currentUser?: {
    name: string;
    avatar?: string;
  };
  placeholder?: string;
  onMarkdownChange?: (markdown: string) => void;
  editorRef?: React.MutableRefObject<any>;
  onNotify?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  ydoc,
  provider,
  currentUser,
  placeholder = "Write document notes here...",
  onMarkdownChange,
  editorRef,
  onNotify,
}) => {
  if (!ydoc || !provider) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Set up editor instance
  const editor = useEditor({
    extensions: [
      // 1. Starter Kit (Disable default history since Yjs collaboration manages updates)
      StarterKit.configure({
        history: false,
        codeBlock: false, // We'll use custom block
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-400 underline hover:text-indigo-350 transition-colors cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg border border-slate-800/80 shadow-lg my-6",
        },
      }),
      
      // 2. Lists & Tables
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,

      // 3. Collaborative additions
      Collaboration.configure({
        document: ydoc,
        field: "prosemirror",
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: currentUser?.name || "Anonymous Collaborator",
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random user color pointer
        },
      }),

      // 4. Custom block nodes
      MathBlock,
      MermaidBlock,
      CustomCodeBlock,
      SlashCommands.configure({
        suggestion: {
          char: "/",
          startOfLine: false,
          command: ({ editor, range, props }: any) => {
            props.command({ editor, range });
          },
          ...slashSuggestion,
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[350px] p-6",
        placeholder,
      },
    },
    onUpdate({ editor }) {
      if (onMarkdownChange) {
        const md = exportToMarkdown(editor);
        onMarkdownChange(md);
      }
    },
  });

  // Assign editor instance to reference if supplied (for parent actions like markdown exports)
  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  return (
    <div className="h-full flex flex-col bg-slate-900/10 text-slate-100 overflow-hidden relative">
      {/* Centered Generate Document card when editor content is empty */}
      {editor && editor.getText().trim() === "" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 p-4">
          <button
            type="button"
            className="pointer-events-auto bg-[#131416]/95 hover:bg-[#1a1a1e] border border-white/5 hover:border-slate-800 text-slate-200 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xl flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Generate document</span>
            <span className="text-[10px] text-slate-500 font-extrabold bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">Ctrl J</span>
          </button>
        </div>
      )}

      {/* Editor Content scroll container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-[#0c0c0e]/10 pb-24">
        <div className="w-full max-w-4xl bg-[#0f0f11]/30 border border-white/5 rounded-2xl shadow-2xl flex flex-col p-4 md:p-8 min-h-[500px]">
          {editor && <EditorBubbleMenu editor={editor} onNotify={onNotify} />}
          {editor && <EditorFloatingMenu editor={editor} />}
          
          <EditorContent editor={editor} className="flex-1 w-full" />
        </div>
      </div>

      {/* Bottom floating editor formatting toolbar capsule */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-[#0f0f11]/90 backdrop-blur-md border border-white/5 rounded-xl shadow-2xl p-1 max-w-[90%] md:max-w-max overflow-x-auto custom-scrollbar flex items-center justify-center">
        <EditorToolbar editor={editor} />
      </div>
    </div>
  );
};
export default CollaborativeEditor;
export { exportToMarkdown, importFromMarkdown };
