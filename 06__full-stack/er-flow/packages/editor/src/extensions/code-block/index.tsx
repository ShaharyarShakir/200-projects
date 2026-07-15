import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useEffect, useRef } from "react";
import { createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { Copy, Check, Code2, Eye, EyeOff, ListOrdered } from "lucide-react";

// Singleton highlighter instance
let shikiHighlighterPromise: Promise<any> | null = null;
const getHighlighterInstance = () => {
  if (!shikiHighlighterPromise) {
    shikiHighlighterPromise = createHighlighter({
      engine: createJavaScriptRegexEngine(),
      themes: ["github-dark"],
      langs: [
        "javascript",
        "typescript",
        "html",
        "css",
        "python",
        "json",
        "sql",
        "bash",
        "go",
        "rust",
        "yaml",
        "markdown",
        "cpp"
      ],
    });
  }
  return shikiHighlighterPromise;

};

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash / Shell" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "cpp", label: "C++" }
];

const CodeBlockComponent: React.FC<any> = ({ node, updateAttributes }) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.code);
  const [code, setCode] = useState(node.attrs.code || "");
  const [language, setLanguage] = useState(node.attrs.language || "javascript");
  const [showLineNumbers, setShowLineNumbers] = useState(node.attrs.showLineNumbers !== false);
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [highlighter, setHighlighter] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Shiki highlighter
  useEffect(() => {
    getHighlighterInstance()
      .then((h) => {
        setHighlighter(h);
      })
      .catch((err) => {
        console.error("Shiki initialization failed:", err);
      });
  }, []);

  // Update highlighted html
  useEffect(() => {
    if (!code.trim()) {
      setHighlightedHtml(`<pre class="shiki"><code class="language-${language}">// Double-click to write code</code></pre>`);
      return;
    }

    if (!highlighter) {
      // Fallback while loading
      setHighlightedHtml(`<pre class="shiki"><code class="language-${language}">${code}</code></pre>`);
      return;
    }

    try {
      const html = highlighter.codeToHtml(code, {
        lang: language,
        theme: "github-dark",
      });
      setHighlightedHtml(html);
    } catch (err) {
      console.warn("Shiki rendering failed, falling back:", err);
      setHighlightedHtml(`<pre class="shiki"><code class="language-${language}">${code}</code></pre>`);
    }
  }, [highlighter, code, language]);

  const handleBlur = () => {
    setIsEditing(false);
    updateAttributes({ code, language, showLineNumbers });
  };

  const toggleLineNumbers = () => {
    const nextVal = !showLineNumbers;
    setShowLineNumbers(nextVal);
    updateAttributes({ showLineNumbers: nextVal });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Generate line numbers column
  const lineNumbers = code.split("\n").map((_, i) => i + 1);

  return (
    <NodeViewWrapper className="code-block-wrapper my-6 relative group border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
      {/* Code Block Header Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800/80 text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-indigo-400" />
          <select
            value={language}
            onChange={(e) => {
              const lang = e.target.value;
              setLanguage(lang);
              updateAttributes({ language: lang });
            }}
            className="bg-transparent border-none text-slate-200 text-xs font-semibold py-0.5 px-1 rounded hover:bg-slate-800 focus:outline-none cursor-pointer text-indigo-400"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-slate-950 text-slate-200">
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Line Numbers Toggle */}
          <button
            type="button"
            title="Toggle line numbers"
            onClick={toggleLineNumbers}
            className={`p-1 rounded transition-colors hover:bg-slate-800 hover:text-slate-200 cursor-pointer ${
              showLineNumbers ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>

          {/* Edit / Preview Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                handleBlur();
              } else {
                setIsEditing(true);
              }
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title={isEditing ? "Preview formatted block" : "Edit source"}
          >
            {isEditing ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy all code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code Editor / Highlighting Viewport */}
      {isEditing ? (
        <div className="bg-slate-950 p-4 font-mono shadow-inner min-h-[120px]">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={handleBlur}
            placeholder={`// Write some ${language} code here...`}
            className="w-full bg-transparent text-slate-100 border-none outline-none resize-y text-xs font-mono min-h-[100px] leading-relaxed"
          />
          <div className="text-[9px] text-slate-600 text-right mt-1">Click outside or click eye icon to highlight</div>
        </div>
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          className="flex bg-slate-950 text-xs p-4 leading-relaxed font-mono cursor-pointer hover:bg-slate-950/90 transition-colors overflow-x-auto min-h-[80px]"
        >
          {showLineNumbers && code.trim() && (
            <div className="text-slate-600 text-right pr-3 select-none border-r border-slate-800/60 mr-3 min-w-[24px]">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>
          )}
          <div
            className="flex-1 shiki-container text-slate-100"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const CustomCodeBlock = Node.create({
  name: "customCodeBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      code: {
        default: "",
      },
      language: {
        default: "javascript",
      },
      showLineNumbers: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-code-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "custom-code-block" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});

export default CustomCodeBlock;
