import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { GitCommit, GitBranch } from "lucide-react";

export const mindmapPlugin: DiagramPlugin = {
  id: "mindmap",
  name: "Mind Map",
  description: "Map brainstorming sessions, ideation structures, root thoughts, and branched sibling/leaf concepts.",
  nodeTypes: [
    {
      type: "mm-root",
      label: "Root Topic",
      icon: GitCommit,
      defaultWidth: 140,
      defaultHeight: 60,
      createDefault: (id, x, y) => ({
        id,
        type: "mm-root",
        x,
        y,
        width: 140,
        height: 60,
        fill: "rgba(244, 63, 94, 0.15)",
        stroke: "#f43f5e",
        strokeWidth: 3,
        opacity: 1,
        text: "Central Idea",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#f43f5e"} strokeWidth={isSelected ? 3.5 : 3} rx="20" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-2 font-sans font-extrabold text-sm text-slate-200">
              <GitCommit className="h-4 w-4 text-rose-500 animate-pulse" />
              <span>{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    },
    {
      type: "mm-node",
      label: "Idea Branch",
      icon: GitBranch,
      defaultWidth: 110,
      defaultHeight: 40,
      createDefault: (id, x, y) => ({
        id,
        type: "mm-node",
        x,
        y,
        width: 110,
        height: 40,
        fill: "transparent",
        stroke: "#ec4899",
        strokeWidth: 2,
        opacity: 1,
        text: "Sub Topic",
      }),
      render: ({ node, isSelected }) => (
        <>
          <path d={`M ${node.x} ${node.y + node.height} L ${node.x + node.width} ${node.y + node.height}`} stroke={isSelected ? "#6366f1" : node.stroke || "#ec4899"} strokeWidth={isSelected ? 3 : 2} fill="none" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center font-sans font-semibold text-xs text-slate-300">
              {node.text}
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  toolbarEntries: [
    {
      id: "mm-root-tool",
      type: "node",
      targetType: "mm-root",
      label: "Central Idea",
      icon: GitCommit,
      tooltip: "Place a Mind Map central idea node"
    },
    {
      id: "mm-node-tool",
      type: "node",
      targetType: "mm-node",
      label: "Sub Topic",
      icon: GitBranch,
      tooltip: "Place a Mind Map subtopic node"
    }
  ]
};
export default mindmapPlugin;
