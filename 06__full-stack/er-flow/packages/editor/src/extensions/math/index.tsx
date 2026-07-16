import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useEffect, useRef } from "react";
import katex from "katex";

// Import KaTeX styles directly so equations render correctly
import "katex/dist/katex.min.css";

const MathBlockComponent: React.FC<any> = ({ node, updateAttributes }) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.value);
  const [value, setValue] = useState(node.attrs.value || "");
  const [html, setHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      if (value.trim()) {
        const rendered = katex.renderToString(value, {
          displayMode: true,
          throwOnError: false,
        });
        setHtml(rendered);
      } else {
        setHtml('<span class="text-slate-500 italic font-sans text-xs">Double-click to type LaTeX equation</span>');
      }
    } catch (err) {
      setHtml(`<span class="text-rose-500 text-xs">Error: ${(err as Error).message}</span>`);
    }
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    updateAttributes({ value });
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <NodeViewWrapper className="math-block my-4">
      {isEditing ? (
        <div className="bg-slate-950 border border-indigo-500/50 rounded-lg p-3 font-mono shadow-inner">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleBlur();
              }
            }}
            placeholder="Type equation (e.g., f(x) = \int_{-\infty}^{\infty} e^{-x^2} dx)"
            className="w-full bg-transparent text-slate-100 border-none outline-none resize-none text-sm h-16"
          />
          <div className="text-[10px] text-slate-500 text-right mt-1">Press Enter to render, Shift+Enter for newline</div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 rounded-lg p-4 flex items-center justify-center cursor-pointer transition-all duration-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </NodeViewWrapper>
  );
};

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      value: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "math-block" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockComponent);
  },
});
export default MathBlock;
