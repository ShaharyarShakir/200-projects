import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { Layers, Box } from "lucide-react";

export const kubernetesPlugin: DiagramPlugin = {
  id: "kubernetes",
  name: "Kubernetes Diagram",
  description: "Illustrate Pods, Services, Deployments, ReplicaSets, Ingress controls, and K8s namespaces.",
  nodeTypes: [
    {
      type: "k8s-pod",
      label: "K8s Pod",
      icon: Box,
      defaultWidth: 120,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "k8s-pod",
        x,
        y,
        width: 120,
        height: 50,
        fill: "rgba(14, 165, 233, 0.15)",
        stroke: "#0ea5e9",
        strokeWidth: 2,
        opacity: 1,
        text: "k8s-pod-worker",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#0ea5e9"} strokeWidth={isSelected ? 2.5 : 2} rx="6" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-1.5 font-sans font-bold text-[10px] text-slate-200 px-1">
              <Box className="h-3.5 w-3.5 text-sky-400" />
              <span className="truncate">{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  toolbarEntries: [
    {
      id: "k8s-pod-tool",
      type: "node",
      targetType: "k8s-pod",
      label: "Pod",
      icon: Box,
      tooltip: "Place a Kubernetes Pod component"
    }
  ]
};
export default kubernetesPlugin;
