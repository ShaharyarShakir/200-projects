import React from "react";
import { FloatingMenu, type Editor } from "@tiptap/react";
import { Plus } from "lucide-react";

interface FloatingMenuProps {
  editor: Editor | null;
}

export const EditorFloatingMenu: React.FC<FloatingMenuProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <FloatingMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1.5 shadow-2xl z-40"
    >
      <button
        type="button"
        title="Insert block"
        onClick={() => {
          editor.chain().focus().insertContent("/").run();
        }}
        className="flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 rounded font-semibold transition-all cursor-pointer"
      >
        <Plus className="h-3 w-3 text-indigo-400" />
        <span>Insert block (Type /)</span>
      </button>
    </FloatingMenu>
  );
};
export default EditorFloatingMenu;
