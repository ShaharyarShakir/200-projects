import { type Editor } from "@tiptap/react";

/**
 * Serializes Tiptap JSON node structure directly to raw Markdown
 */
export function exportToMarkdown(editor: Editor): string {
  const doc = editor.getJSON();
  if (!doc || !doc.content) return "";

  let markdown = "";

  const getTextFromNode = (node: any): string => {
    if (!node.content) return "";
    return node.content
      .map((child: any) => {
        let text = child.text || "";
        if (child.marks) {
          child.marks.forEach((mark: any) => {
            if (mark.type === "bold") text = `**${text}**`;
            if (mark.type === "italic") text = `*${text}*`;
            if (mark.type === "underline") text = `<u>${text}</u>`;
            if (mark.type === "code") text = `\`${text}\``;
            if (mark.type === "highlight") text = `==${text}==`;
            if (mark.type === "link") text = `[${text}](${mark.attrs?.href || ""})`;
          });
        }
        return text;
      })
      .join("");
  };

  const parseList = (listNode: any, depth = 0): string => {
    if (!listNode.content) return "";
    let listMd = "";
    const indent = "  ".repeat(depth);
    const bullet = listNode.type === "orderedList" ? "1." : "*";

    listNode.content.forEach((li: any, index: number) => {
      const prefix = listNode.type === "orderedList" ? `${index + 1}.` : bullet;
      if ((li.type === "listItem" || li.type === "taskItem") && li.content) {
        // Find text content (usually in a paragraph)
        const pNode = li.content.find((c: any) => c.type === "paragraph") || li.content[0];
        const text = getTextFromNode(pNode);

        if (li.type === "taskItem") {
          const checked = li.attrs?.checked ? "[x]" : "[ ]";
          listMd += `${indent}- ${checked} ${text}\n`;
        } else {
          listMd += `${indent}${prefix} ${text}\n`;
        }

        // Handle nested lists inside list item content
        li.content.forEach((child: any) => {
          if (
            child.type === "bulletList" ||
            child.type === "orderedList" ||
            child.type === "taskList"
          ) {
            listMd += parseList(child, depth + 1);
          }
        });
      }
    });
    return listMd;
  };

  const parseTable = (tableNode: any): string => {
    if (!tableNode.content) return "";
    let tableRows: string[][] = [];

    tableNode.content.forEach((rowNode: any) => {
      if (rowNode.type === "tableRow" && rowNode.content) {
        let cells: string[] = [];
        rowNode.content.forEach((cellNode: any) => {
          cells.push(getTextFromNode(cellNode).replace(/\n/g, " ").trim());
        });
        tableRows.push(cells);
      }
    });

    if (tableRows.length === 0) return "";
    let tableMd = "";

    // Header row
    const headers = tableRows[0];
    tableMd += `| ${headers.join(" | ")} |\n`;

    // Divider row
    tableMd += `| ${headers.map(() => "---").join(" | ")} |\n`;

    // Data rows
    for (let i = 1; i < tableRows.length; i++) {
      tableMd += `| ${tableRows[i].join(" | ")} |\n`;
    }

    return tableMd + "\n";
  };

  const parseNodes = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.type === "heading") {
        const level = node.attrs?.level || 1;
        const text = getTextFromNode(node);
        markdown += `${"#".repeat(level)} ${text}\n\n`;
      } else if (node.type === "paragraph") {
        const text = getTextFromNode(node);
        markdown += `${text}\n\n`;
      } else if (node.type === "image") {
        const alt = node.attrs?.alt || "";
        const src = node.attrs?.src || "";
        markdown += `![${alt}](${src})\n\n`;
      } else if (node.type === "blockquote") {
        const text = getTextFromNode(node);
        markdown += `> ${text}\n\n`;
      } else if (node.type === "bulletList" || node.type === "orderedList" || node.type === "taskList") {
        markdown += parseList(node, 0) + "\n";
      } else if (node.type === "codeBlock" || node.type === "customCodeBlock") {
        const codeText = node.attrs?.code !== undefined ? node.attrs.code : getTextFromNode(node);
        const lang = node.attrs?.language || "";
        markdown += `\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
      } else if (node.type === "mathBlock") {
        markdown += `$$\n${node.attrs?.value || ""}\n$$\n\n`;
      } else if (node.type === "mermaidBlock") {
        markdown += `\`\`\`mermaid\n${node.attrs?.code || ""}\n\`\`\`\n\n`;
      } else if (node.type === "horizontalRule") {
        markdown += "---\n\n";
      } else if (node.type === "table") {
        markdown += parseTable(node);
      } else {
        if (node.content) parseNodes(node.content);
      }
    }
  };

  parseNodes(doc.content);
  return markdown.trim();
}

/**
 * Helper to escape HTML characters inside code/math blocks
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Parses inline formatting tags inside text blocks
 */
function parseInlineFormatting(markdownText: string): string {
  let text = markdownText;

  // Standalone images inside paragraph: ![alt](url) -> <img src="url" alt="alt" />
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');

  // Links: [text](url) -> <a href="$2">$1</a>
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Bold: **text** or __text__ -> <strong>text</strong>
  text = text.replace(/\*\*(.*?)\*\_/g, "<strong>$1</strong>");
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_ -> <em>text</em>
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  text = text.replace(/_(.*?)_/g, "<em>$1</em>");

  // Inline Code: `code` -> <code>code</code>
  text = text.replace(/`(.*?)`/g, "<code>$1</code>");

  // Highlight: ==text== -> <mark>text</mark>
  text = text.replace(/==(.*?)==/g, "<mark>$1</mark>");

  return text;
}

/**
 * Parses nested list structures based on line indentations
 */
function parseListLines(lines: string[]): string {
  let listHtml = "";
  const stack: { type: "ul" | "ol" | "taskList"; indent: number }[] = [];

  const getLineInfo = (line: string) => {
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const trimmed = line.trim();

    let type: "ul" | "ol" | "taskList" = "ul";
    let content = trimmed;
    let checked: boolean | null = null;

    if (/^\[[ xX]\]\s+/.test(trimmed)) {
      type = "taskList";
      checked = trimmed.startsWith("[x]") || trimmed.startsWith("[X]");
      content = trimmed.substring(5).trim();
    } else if (/^[\*\-\+]\s+\[[ xX]\]\s+/.test(trimmed)) {
      type = "taskList";
      checked = trimmed.includes("[x]") || trimmed.includes("[X]");
      content = trimmed.replace(/^[\*\-\+]\s+\[[ xX]\]\s+/, "").trim();
    } else if (/^[\*\-\+]\s+/.test(trimmed)) {
      type = "ul";
      content = trimmed.replace(/^[\*\-\+]\s+/, "").trim();
    } else if (/^\d+\.\s+/.test(trimmed)) {
      type = "ol";
      content = trimmed.replace(/^\d+\.\s+/, "").trim();
    }

    return { indent, type, content, checked };
  };

  lines.forEach((line) => {
    if (line.trim() === "") return;
    const { indent, type, content, checked } = getLineInfo(line);
    const inlineHtml = parseInlineFormatting(content);

    let current = stack[stack.length - 1];

    if (!current) {
      const tag = type === "taskList" ? 'ul data-type="taskList"' : type;
      listHtml += `<${tag}>`;
      stack.push({ type, indent });
    } else if (indent > current.indent) {
      const tag = type === "taskList" ? 'ul data-type="taskList"' : type;
      listHtml += `<${tag}>`;
      stack.push({ type, indent });
    } else if (indent < current.indent) {
      while (stack.length > 0 && stack[stack.length - 1].indent > indent) {
        const popped = stack.pop();
        const tag = popped?.type === "taskList" ? "ul" : popped?.type;
        listHtml += `</${tag}>`;
      }
      current = stack[stack.length - 1];
      if (current && current.type !== type) {
        const oldTag = current.type === "taskList" ? "ul" : current.type;
        listHtml += `</${oldTag}>`;
        const newTag = type === "taskList" ? 'ul data-type="taskList"' : type;
        listHtml += `<${newTag}>`;
        current.type = type;
      }
    } else if (current.type !== type) {
      const oldTag = current.type === "taskList" ? "ul" : current.type;
      listHtml += `</${oldTag}>`;
      const newTag = type === "taskList" ? 'ul data-type="taskList"' : type;
      listHtml += `<${newTag}>`;
      current.type = type;
    }

    if (type === "taskList") {
      const checkedAttr = checked ? "checked" : "";
      listHtml += `<li data-checked="${checked ? "true" : "false"}"><label><input type="checkbox" ${checkedAttr} /><span></span></label><div>${inlineHtml}</div></li>`;
    } else {
      listHtml += `<li>${inlineHtml}</li>`;
    }
  });

  while (stack.length > 0) {
    const popped = stack.pop();
    const tag = popped?.type === "taskList" ? "ul" : popped?.type;
    listHtml += `</${tag}>`;
  }

  return listHtml;
}

/**
 * Dynamically parses Markdown text structures to populate Tiptap document HTML elements
 */
export function importFromMarkdown(editor: Editor, markdown: string): void {
  let html = "";
  const lines = markdown.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    // 1. Code blocks / Mermaid blocks
    if (trimmed.startsWith("```")) {
      const lang = trimmed.replace("```", "").trim();
      let codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      const codeContent = codeLines.join("\n");
      if (lang === "mermaid") {
        html += `<div data-type="mermaid-block" code="${escapeHtml(codeContent)}"></div>`;
      } else {
        html += `<div data-type="custom-code-block" code="${escapeHtml(codeContent)}" language="${lang || "javascript"}"></div>`;
      }
      continue;
    }

    // 2. Math blocks
    if (trimmed.startsWith("$$")) {
      let mathLines: string[] = [];
      if (trimmed.endsWith("$$") && trimmed.length > 2) {
        const mathContent = trimmed.substring(2, trimmed.length - 2).trim();
        html += `<div data-type="math-block" value="${escapeHtml(mathContent)}"></div>`;
        i++;
        continue;
      }
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("$$")) {
        mathLines.push(lines[i]);
        i++;
      }
      i++; // consume closing $$
      const mathContent = mathLines.join("\n").trim();
      html += `<div data-type="math-block" value="${escapeHtml(mathContent)}"></div>`;
      continue;
    }

    // 3. Divider
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      html += "<hr />";
      i++;
      continue;
    }

    // 4. Headings
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const inlineHtml = parseInlineFormatting(match[2]);
        html += `<h${level}>${inlineHtml}</h${level}>`;
        i++;
        continue;
      }
    }

    // 5. Blockquotes
    if (trimmed.startsWith(">")) {
      let quoteLines: string[] = [trimmed.substring(1).trim()];
      i++;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().substring(1).trim());
        i++;
      }
      const quoteContent = parseInlineFormatting(quoteLines.join("<br>"));
      html += `<blockquote>${quoteContent}</blockquote>`;
      continue;
    }

    // 6. Tables
    if (trimmed.startsWith("|")) {
      let tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        let tableHtml = "<table>";
        tableLines.forEach((tLine, idx) => {
          if (idx === 1 && tLine.includes("---")) {
            return;
          }
          const cells = tLine.split("|").slice(1, -1).map((c) => c.trim());
          tableHtml += "<tr>";
          cells.forEach((cell) => {
            const cellTag = idx === 0 ? "th" : "td";
            tableHtml += `<${cellTag}>${parseInlineFormatting(cell)}</${cellTag}>`;
          });
          tableHtml += "</tr>";
        });
        tableHtml += "</table>";
        html += tableHtml;
        continue;
      }
    }

    // 7. Lists
    const isBulletItem = (l: string) => /^\s*[\*\-\+]\s+/.test(l) && !/^\s*[\*\-\+]\s+\[[ xX]\]\s+/.test(l);
    const isOrderedItem = (l: string) => /^\s*\d+\.\s+/.test(l);
    const isTaskItem = (l: string) => /^\s*[\*\-\+]\s+\[[ xX]\]\s+/.test(l);

    if (isBulletItem(line) || isOrderedItem(line) || isTaskItem(line)) {
      let listLines: string[] = [];
      while (
        i < lines.length &&
        (isBulletItem(lines[i]) ||
          isOrderedItem(lines[i]) ||
          isTaskItem(lines[i]) ||
          /^\s+/.test(lines[i]))
      ) {
        listLines.push(lines[i]);
        i++;
      }
      html += parseListLines(listLines);
      continue;
    }

    // 8. Standalone image in paragraph
    if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        html += `<img src="${imgMatch[2]}" alt="${imgMatch[1]}" />`;
        i++;
        continue;
      }
    }

    // 9. Standard paragraph
    const inlineHtml = parseInlineFormatting(trimmed);
    html += `<p>${inlineHtml}</p>`;
    i++;
  }

  editor.commands.setContent(html);
}
