import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { Server, Database, Activity } from "lucide-react";

export const architecturePlugin: DiagramPlugin = {
  id: "architecture",
  name: "System Architecture",
  description: "Model high-level system components, application layers, load balancers, database instances, and API nodes.",
  nodeTypes: [
    {
      type: "arch-lb",
      label: "Load Balancer",
      icon: Activity,
      defaultWidth: 120,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "arch-lb",
        x,
        y,
        width: 120,
        height: 50,
        fill: "rgba(59, 130, 246, 0.15)",
        stroke: "#3b82f6",
        strokeWidth: 2,
        opacity: 1,
        text: "Load Balancer",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#3b82f6"} strokeWidth={isSelected ? 2.5 : 2} rx="8" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-2 font-sans font-bold text-xs text-slate-200">
              <Activity className="h-4 w-4 text-blue-400" />
              <span>{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    },
    {
      type: "arch-server",
      label: "App Server",
      icon: Server,
      defaultWidth: 120,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "arch-server",
        x,
        y,
        width: 120,
        height: 50,
        fill: "rgba(16, 185, 129, 0.15)",
        stroke: "#10b981",
        strokeWidth: 2,
        opacity: 1,
        text: "App Instance",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#10b981"} strokeWidth={isSelected ? 2.5 : 2} rx="8" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-2 font-sans font-bold text-xs text-slate-200">
              <Server className="h-4 w-4 text-emerald-400" />
              <span>{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  toolbarEntries: [
    {
      id: "arch-lb-tool",
      type: "node",
      targetType: "arch-lb",
      label: "Load Balancer",
      icon: Activity,
      tooltip: "Place a Load Balancer architecture node"
    },
    {
      id: "arch-server-tool",
      type: "node",
      targetType: "arch-server",
      label: "App Server",
      icon: Server,
      tooltip: "Place an App Server instance node"
    }
  ]
};
export default architecturePlugin;
