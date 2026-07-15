import * as Y from "yjs";

export function parseYjsSnapshot(snapshotBuffer: Buffer) {
  const doc = new Y.Doc();
  try {
    Y.applyUpdate(doc, new Uint8Array(snapshotBuffer));
  } catch (err) {
    console.error("Failed to apply Yjs snapshot update:", err);
  }

  // Extract editor text from ProseMirror XML Fragment
  const prosemirrorFragment = doc.getXmlFragment("prosemirror");
  const documentText = extractTextFromXml(prosemirrorFragment);

  // Extract shapes map
  const shapesMap = doc.getMap("shapes");
  const shapes = shapesMap.toJSON();

  return {
    documentText,
    shapes,
  };
}

function extractTextFromXml(node: Y.XmlFragment | Y.XmlElement | Y.XmlText | any): string {
  if (node instanceof Y.XmlText) {
    return node.toString();
  }

  if (node.length === undefined) {
    return "";
  }

  let text = "";
  for (let i = 0; i < node.length; i++) {
    const child = node.get(i);
    if (child instanceof Y.XmlText) {
      text += child.toString();
    } else if (child instanceof Y.XmlElement) {
      const childText = extractTextFromXml(child);
      // Handle spacing for common block-level components in editor
      const blockTags = ["paragraph", "heading", "bullet_list", "ordered_list", "list_item", "code_block"];
      if (blockTags.includes(child.nodeName || "")) {
        text += "\n" + childText + "\n";
      } else {
        text += childText;
      }
    }
  }
  return text.trim();
}
