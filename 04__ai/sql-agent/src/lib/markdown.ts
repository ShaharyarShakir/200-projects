import { marked } from "marked";
import type { Token, Tokens } from "marked";
import DOMPurify from "dompurify";
import sanitizeHtml from "sanitize-html";

// Configure marked options
marked.setOptions({
  gfm: true,        // GitHub Flavored Markdown (tables, strikethrough, etc.)
  breaks: true,     // Convert \n to <br> inside paragraphs
});

// Custom renderer for syntax-highlighted code blocks
const renderer = new marked.Renderer();

renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const langClass = lang ? ` language-${lang}` : "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return `<pre><code class="${langClass}">${escaped}</code></pre>`;
};
renderer.codespan = ({ text }: { text: string }) => {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return `<code>${escaped}</code>`;
};


renderer.blockquote = ({ tokens }: { tokens: Token[] }) => {
  const body = marked.Parser.parse(tokens);
  return `<blockquote>${body}</blockquote>`;
};

renderer.table = (token: Tokens.Table) => {
  const headerRow = token.header
    .map((cell) => {
      const content = marked.Parser.parseInline(cell.tokens);
      return `<th>${content}</th>`;
    })
    .join("");

  const bodyRows = token.rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const content = marked.Parser.parseInline(cell.tokens);
          return `<td>${content}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
};

marked.use({ renderer });

/**
 * Parse markdown string to sanitized HTML.
 * Uses marked for parsing and DOMPurify for XSS sanitization.
 */
export function parseMarkdown(input: string): string {
  if (!input) return "";

  // marked.parse returns string when async is false (default)
  const rawHtml = marked.parse(input) as string;

  // Sanitize on the client side only (DOMPurify needs the DOM)
  if (typeof window === "undefined") {
    // Server-side: sanitize here before returning HTML
    const clean = sanitizeHtml(rawHtml, {
      allowedTags: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "br", "hr",
        "ul", "ol", "li",
        "strong", "em", "del", "s",
        "code", "pre",
        "blockquote",
        "table", "thead", "tbody", "tr", "th", "td",
        "a",
        "img",
        "span",
      ],
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt", "title"],
        "*": ["class"],
      },
      // Keep the same link safety behavior as the client path
      allowedSchemes: ["http", "https", "mailto", "tel"],
    });

    return clean.replace(
      /<a\s/g,
      '<a target="_blank" rel="noopener noreferrer" '
    );
  }

  const clean = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "strong", "em", "del", "s",
      "code", "pre",
      "blockquote",
      "table", "thead", "tbody", "tr", "th", "td",
      "a",
      "img",
      "span",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "title",
      "class",
    ],
    // Force links to open safely
    FORCE_BODY: false,
    ADD_ATTR: ["target"],
    // Hook to add rel="noopener noreferrer" on all links
    RETURN_DOM: false,
  });

  // Post-sanitize: add rel + target to all <a> tags
  return clean.replace(
    /<a\s/g,
    '<a target="_blank" rel="noopener noreferrer" '
  );
}

/**
 * Check if a string contains markdown syntax.
 * Used to decide whether to render as markdown or plain text.
 */
export function hasMarkdown(text: string): boolean {
  const patterns = [
    /#{1,6}\s/,           // headings
    /\*\*.+?\*\*/,        // bold
    /\*.+?\*/,            // italic
    /`[^`]+`/,            // inline code
    /```[\s\S]*?```/,     // code block
    /^\s*[-*+]\s/m,       // unordered list
    /^\s*\d+\.\s/m,       // ordered list
    /^\s*>/m,             // blockquote
    /\[.+?\]\(.+?\)/,     // link
    /\|.+\|/,             // table
    /^---$/m,             // hr
  ];
  return patterns.some((p) => p.test(text));
}