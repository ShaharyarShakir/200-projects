import React, { useState } from "react";
import { BubbleMenu, type Editor } from "@tiptap/react";
import { Bold, Italic, Underline, Highlighter, Sparkles, Link2, Link2Off, ChevronLeft } from "lucide-react";

interface BubbleMenuProps {
  editor: Editor | null;
}

export const EditorBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
  const [showAiOptions, setShowAiOptions] = useState(false);
  if (!editor) return null;

  const handleLinkToggle = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt("Enter link URL:");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  const triggerAiAction = (action: string) => {
    alert(`AI Action [${action}] is under development and will be completed in a future phase!`);
    setShowAiOptions(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-2xl z-40"
    >
      {showAiOptions ? (
        <div className="flex items-center gap-1.5 min-w-[280px]">
          <button
            type="button"
            onClick={() => setShowAiOptions(false)}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
          
          <button
            type="button"
            onClick={() => triggerAiAction("Explain")}
            className="px-2 py-1 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded font-semibold cursor-pointer"
          >
            Explain
          </button>
          <button
            type="button"
            onClick={() => triggerAiAction("Rewrite")}
            className="px-2 py-1 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded font-semibold cursor-pointer"
          >
            Rewrite
          </button>
          <button
            type="button"
            onClick={() => triggerAiAction("Summarize")}
            className="px-2 py-1 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded font-semibold cursor-pointer"
          >
            Summarize
          </button>
          <button
            type="button"
            onClick={() => triggerAiAction("Translate")}
            className="px-2 py-1 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded font-semibold cursor-pointer"
          >
            Translate
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              editor.isActive("bold") ? "text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              editor.isActive("italic") ? "text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              editor.isActive("underline") ? "text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Underline className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              editor.isActive("highlight") ? "text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleLinkToggle}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              editor.isActive("link") ? "text-indigo-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {editor.isActive("link") ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

          {/* AI Block Extension point */}
          <button
            type="button"
            onClick={() => setShowAiOptions(true)}
            className="flex items-center gap-1 py-1 px-2 rounded text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition-all font-semibold text-[10px] cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Ask AI</span>
          </button>
        </div>
      )}
    </BubbleMenu>
  );
};

export default EditorBubbleMenu;
