import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { Cloud, Play } from "lucide-react";

export const gcpPlugin: DiagramPlugin = {
  id: "gcp",
  name: "GCP Architecture",
  description: "Create Google Cloud Platform topology diagrams, Compute Engines, Cloud Run services, and BigQuery datasets.",
  nodeTypes: [
    {
      type: "gcp-cloudrun",
      label: "GCP Cloud Run",
      icon: Play,
      defaultWidth: 120,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "gcp-cloudrun",
        x,
        y,
        width: 120,
        height: 50,
        fill: "rgba(219, 68, 85, 0.15)",
        stroke: "#db4437",
        strokeWidth: 2,
        opacity: 1,
        text: "Cloud Run",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#db4437"} strokeWidth={isSelected ? 2.5 : 2} rx="6" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-2 font-sans font-bold text-[10px] text-slate-200">
              <Play className="h-3.5 w-3.5 text-red-500 fill-red-500/20" />
              <span>{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  toolbarEntries: [
    {
      id: "gcp-cloudrun-tool",
      type: "node",
      targetType: "gcp-cloudrun",
      label: "Cloud Run",
      icon: Play,
      tooltip: "Place a Google Cloud Run service node"
    }
  ]
};
export default gcpPlugin;
