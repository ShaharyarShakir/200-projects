import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { Cloud, Globe } from "lucide-react";

export const azurePlugin: DiagramPlugin = {
  id: "azure",
  name: "Azure Architecture",
  description: "Create Microsoft Azure topology diagrams, Virtual Machines, App Services, and Cosmos DB instances.",
  nodeTypes: [
    {
      type: "azure-app",
      label: "Azure Web App",
      icon: Globe,
      defaultWidth: 120,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "azure-app",
        x,
        y,
        width: 120,
        height: 50,
        fill: "rgba(0, 120, 212, 0.15)",
        stroke: "#0078d4",
        strokeWidth: 2,
        opacity: 1,
        text: "Web App",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#0078d4"} strokeWidth={isSelected ? 2.5 : 2} rx="6" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-2 font-sans font-bold text-[10px] text-slate-200">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span>{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  toolbarEntries: [
    {
      id: "azure-app-tool",
      type: "node",
      targetType: "azure-app",
      label: "Web App",
      icon: Globe,
      tooltip: "Place a Microsoft Azure Web App instance node"
    }
  ]
};
export default azurePlugin;
