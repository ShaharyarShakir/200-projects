import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Code2,
  Sigma,
  GitBranch,
  Quote,
  Minus,
  Image as ImageIcon
} from "lucide-react";

export interface CommandItem {
  title: string;
  description: string;
  icon: any;
  command: (props: { editor: any; range: any }) => void;
}

export const slashCommandsList: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bulleted list",
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Ordered List",
    description: "Create a list with numbering",
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "List with checkboxes for tasks",
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Table",
    description: "Insert a 3x3 table",
    icon: TableIcon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Image",
    description: "Insert an image from a URL",
    icon: ImageIcon,
    command: ({ editor, range }) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
  {
    title: "Code Block",
    description: "Monospace block with Shiki syntax highlighting",
    icon: Code2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: "customCodeBlock", attrs: { code: "", language: "javascript" } }).run();
    },
  },
  {
    title: "Math Equation",
    description: "LaTeX mathematical formula",
    icon: Sigma,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: "mathBlock", attrs: { value: "" } }).run();
    },
  },
  {
    title: "Mermaid Diagram",
    description: "Editable flowchart diagram block",
    icon: GitBranch,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: "mermaidBlock", attrs: { code: "" } }).run();
    },
  },
  {
    title: "Quote",
    description: "Create a highlighted blockquote",
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Insert a horizontal line divider",
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
export default SlashCommands;
