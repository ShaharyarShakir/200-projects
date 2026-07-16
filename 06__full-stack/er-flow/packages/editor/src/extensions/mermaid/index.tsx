import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

// Initialize Mermaid with a premium dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  themeVariables: {
    background: "#0f172a", // Match deep slate
    primaryColor: "#6366f1",
    primaryTextColor: "#f8fafc",
    lineColor: "#475569",
  },
});

const MermaidBlockComponent: React.FC<any> = ({ node, updateAttributes }) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.code);
  const [code, setCode] = useState(node.attrs.code || "");
  const [svgHtml, setSvgHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const containerId = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (!code.trim()) {
      setSvgHtml('<span class="text-slate-500 italic font-sans text-xs">Double-click to write Mermaid chart (e.g. flowchart TD)</span>');
      setError(null);
      return;
    }

    const renderDiagram = async () => {
      try {
        // Render expects a unique ID and the mermaid chart code
        const { svg } = await mermaid.render(containerId.current, code);
        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          // If error occurs, capture message
          setError((err as Error).message || "Invalid Mermaid syntax");
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const handleBlur = () => {
    setIsEditing(false);
    updateAttributes({ code });
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <NodeViewWrapper className="mermaid-block my-5">
      {isEditing ? (
        <div className="bg-slate-950 border border-indigo-500/50 rounded-lg p-3 font-mono shadow-lg">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={handleBlur}
            placeholder={`flowchart TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[End]`}
            className="w-full bg-transparent text-slate-100 border-none outline-none resize-y text-xs h-28 font-mono"
          />
          <div className="text-[10px] text-slate-500 text-right mt-1">Click outside to render diagram</div>
        </div>
      ) : (
        <div className="relative group">
          {error ? (
            <div
              onClick={() => setIsEditing(true)}
              className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-4 cursor-pointer text-xs text-rose-300 font-mono space-y-1.5"
            >
              <div className="font-bold text-rose-400">Mermaid Render Error:</div>
              <div className="text-[11px] whitespace-pre-wrap">{error}</div>
              <div className="text-[10px] text-slate-500 italic mt-1">(Click to edit diagram source)</div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 rounded-lg p-5 flex items-center justify-center cursor-pointer transition-all duration-200 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}
          
          <div className="absolute top-2 right-2 bg-slate-900/80 border border-slate-800 text-[9px] text-slate-400 font-semibold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Click to Edit
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const MermaidBlock = Node.create({
  name: "mermaidBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      code: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "mermaid-block" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlockComponent);
  },
});
export default MermaidBlock;
