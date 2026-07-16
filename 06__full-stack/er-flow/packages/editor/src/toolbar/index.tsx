import React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Code2,
  Sigma,
  GitBranch,
  Quote,
  Minus,
  Grid3X3,
  Trash2,
  Undo,
  Redo,
  Image as ImageIcon
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg select-none">
      {/* 0. Undo / Redo */}
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
      >
        <Undo className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Redo (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
      >
        <Redo className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 mx-1" />

      {/* 1. Standard text formats */}
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("bold") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("italic") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Underline (Ctrl+U)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("underline") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Highlight"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("highlight") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Highlighter className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 mx-1" />

      {/* 2. Heading selectors */}
      <button
        type="button"
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("heading", { level: 1 }) ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Heading1 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("heading", { level: 2 }) ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Heading2 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("heading", { level: 3 }) ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Heading3 className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 mx-1" />

      {/* 3. Lists */}
      <button
        type="button"
        title="Bullet List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("bulletList") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <List className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Ordered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("orderedList") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Task List"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("taskList") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <CheckSquare className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 mx-1" />

      {/* 4. Blocks (Code, Quote, Divider) */}
      <button
        type="button"
        title="Code Block"
        onClick={() => editor.chain().focus().insertContent({ type: "customCodeBlock", attrs: { code: "", language: "javascript" } }).run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("customCodeBlock") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Code2 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("blockquote") ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <Quote className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Horizontal Line"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 mx-1" />

      {/* 5. Custom blocks (Math / Mermaid / Image) */}
      <button
        type="button"
        title="LaTeX Math block"
        onClick={() => editor.chain().focus().insertContent({ type: "mathBlock", attrs: { value: "" } }).run()}
        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
      >
        <Sigma className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Mermaid chart"
        onClick={() => editor.chain().focus().insertContent({ type: "mermaidBlock", attrs: { code: "" } }).run()}
        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
      >
        <GitBranch className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Insert Image"
        onClick={() => {
          const url = window.prompt("Enter image URL:");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-[1px] bg-slate-800 mx-1" />

      {/* 6. Tables Actions */}
      <button
        type="button"
        title="Insert Table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className={`p-1.5 rounded transition-all cursor-pointer ${
          editor.isActive("table") ? "bg-slate-800 text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        <TableIcon className="h-3.5 w-3.5" />
      </button>

      {editor.isActive("table") && (
        <div className="flex items-center gap-0.5 bg-slate-950 px-1 py-0.5 rounded border border-slate-850">
          <button
            type="button"
            title="Add Row"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="p-1 text-[10px] bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:text-white rounded cursor-pointer"
          >
            +Row
          </button>
          <button
            type="button"
            title="Add Column"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="p-1 text-[10px] bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:text-white rounded cursor-pointer"
          >
            +Col
          </button>
          <button
            type="button"
            title="Merge Cells"
            onClick={() => editor.chain().focus().mergeCells().run()}
            className="p-1 text-[10px] bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:text-white rounded cursor-pointer"
          >
            Merge
          </button>
          <button
            type="button"
            title="Delete Row"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            title="Delete Table"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
          >
            <Grid3X3 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
export default EditorToolbar;
