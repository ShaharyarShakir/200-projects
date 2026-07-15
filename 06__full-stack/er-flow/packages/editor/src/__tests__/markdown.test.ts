import { describe, it, expect } from "vitest";
import { exportToMarkdown, importFromMarkdown } from "../markdown";

describe("Enhanced Markdown Serialization & Deserialization", () => {
  it("should serialize custom block elements (Math & Mermaid)", () => {
    const mockEditor = {
      getJSON: () => ({
        type: "doc",
        content: [
          {
            type: "mathBlock",
            attrs: { value: "e^{i\\pi} + 1 = 0" },
          },
          {
            type: "mermaidBlock",
            attrs: { code: "graph TD\nA --> B" },
          },
        ],
      }),
    } as any;

    const md = exportToMarkdown(mockEditor);
    expect(md).toBe("$$\ne^{i\\pi} + 1 = 0\n$$\n\n```mermaid\ngraph TD\nA --> B\n```");
  });

  it("should serialize CustomCodeBlock with code and language", () => {
    const mockEditor = {
      getJSON: () => ({
        type: "doc",
        content: [
          {
            type: "customCodeBlock",
            attrs: { code: "const x = 5;", language: "javascript" },
          },
        ],
      }),
    } as any;

    const md = exportToMarkdown(mockEditor);
    expect(md).toBe("```javascript\nconst x = 5;\n```");
  });

  it("should serialize GFM tables correctly", () => {
    const mockEditor = {
      getJSON: () => ({
        type: "doc",
        content: [
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  { type: "tableHeader", content: [{ type: "text", text: "Name" }] },
                  { type: "tableHeader", content: [{ type: "text", text: "Role" }] },
                ],
              },
              {
                type: "tableRow",
                content: [
                  { type: "tableCell", content: [{ type: "text", text: "Shaharyar" }] },
                  { type: "tableCell", content: [{ type: "text", text: "Lead Dev" }] },
                ],
              },
            ],
          },
        ],
      }),
    } as any;

    const md = exportToMarkdown(mockEditor);
    expect(md).toBe("| Name | Role |\n| --- | --- |\n| Shaharyar | Lead Dev |");
  });

  it("should serialize lists recursively including nested lists", () => {
    const mockEditor = {
      getJSON: () => ({
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Item 1" }] },
                  {
                    type: "bulletList",
                    content: [
                      {
                        type: "listItem",
                        content: [
                          { type: "paragraph", content: [{ type: "text", text: "Nested Item" }] },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as any;

    const md = exportToMarkdown(mockEditor);
    expect(md).toBe("* Item 1\n  * Nested Item");
  });

  it("should serialize inline formatting like links and bold", () => {
    const mockEditor = {
      getJSON: () => ({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Click " },
              {
                type: "text",
                text: "here",
                marks: [{ type: "link", attrs: { href: "https://eraser.io" } }],
              },
              { type: "text", text: " for " },
              {
                type: "text",
                text: "bold",
                marks: [{ type: "bold" }],
              },
            ],
          },
        ],
      }),
    } as any;

    const md = exportToMarkdown(mockEditor);
    expect(md).toBe("Click [here](https://eraser.io) for **bold**");
  });

  it("should parse inline markdown formatting correctly in importFromMarkdown", () => {
    let importedHtml = "";
    const mockEditor = {
      commands: {
        setContent: (html: string) => {
          importedHtml = html;
        },
      },
    } as any;

    importFromMarkdown(mockEditor, "Click [here](https://eraser.io) for **bold** and `code`!");
    expect(importedHtml).toBe("<p>Click <a href=\"https://eraser.io\">here</a> for <strong>bold</strong> and <code>code</code>!</p>");
  });

  it("should parse tables correctly in importFromMarkdown", () => {
    let importedHtml = "";
    const mockEditor = {
      commands: {
        setContent: (html: string) => {
          importedHtml = html;
        },
      },
    } as any;

    importFromMarkdown(mockEditor, "| Name | Role |\n| --- | --- |\n| Shaharyar | Lead |");
    expect(importedHtml).toBe("<table><tr><th>Name</th><th>Role</th></tr><tr><td>Shaharyar</td><td>Lead</td></tr></table>");
  });
});
