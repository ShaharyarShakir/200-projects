import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { Network, ShieldAlert } from "lucide-react";

export const networkPlugin: DiagramPlugin = {
  id: "network",
  name: "Network Topology",
  description: "Illustrate subnet divisions, routers, switches, gateways, firewalls, and node interfaces.",
  nodeTypes: [
    {
      type: "net-router",
      label: "Router",
      icon: Network,
      defaultWidth: 100,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "net-router",
        x,
        y,
        width: 100,
        height: 50,
        fill: "rgba(217, 70, 239, 0.15)",
        stroke: "#d946ef",
        strokeWidth: 2,
        opacity: 1,
        text: "Gateway Router",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#d946ef"} strokeWidth={isSelected ? 2.5 : 2} rx="8" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-2 font-sans font-bold text-xs text-slate-200">
              <Network className="h-4 w-4 text-fuchsia-400" />
              <span>{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  toolbarEntries: [
    {
      id: "net-router-tool",
      type: "node",
      targetType: "net-router",
      label: "Gateway Router",
      icon: Network,
      tooltip: "Place a network Router node"
    }
  ]
};
export default networkPlugin;
