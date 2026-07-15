import { describe, it, expect } from "vitest";
import { exportToMarkdown } from "../markdown";

describe("Markdown Serialization", () => {
  it("should serialize headings and paragraphs", () => {
    const mockEditor = {
      getJSON: () => ({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Main Title" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is a paragraph." }],
          },
        ],
      }),
    } as any;

    const md = exportToMarkdown(mockEditor);
    expect(md).toBe("# Main Title\n\nThis is a paragraph.");
  });

  it("should serialize blockquotes and dividers", () => {
    const mockEditor = {
      getJSON: () => ({
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [{ type: "text", text: "Quote me on this" }],
          },
          {
            type: "horizontalRule",
          },
        ],
      }),
    } as any;

    const md = exportToMarkdown(mockEditor);
    expect(md).toBe("> Quote me on this\n\n---");
  });
});
