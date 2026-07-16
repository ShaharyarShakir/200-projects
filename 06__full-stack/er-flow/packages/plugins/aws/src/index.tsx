import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { Cloud, Zap, HardDrive } from "lucide-react";

export const awsPlugin: DiagramPlugin = {
  id: "aws",
  name: "AWS Architecture",
  description: "Create Amazon Web Services topologies, EC2 instances, Lambda functions, S3 buckets, and RDS gateways.",
  nodeTypes: [
    {
      type: "aws-lambda",
      label: "AWS Lambda",
      icon: Zap,
      defaultWidth: 120,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "aws-lambda",
        x,
        y,
        width: 120,
        height: 50,
        fill: "rgba(245, 158, 11, 0.15)",
        stroke: "#f59e0b",
        strokeWidth: 2,
        opacity: 1,
        text: "handler()",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill || "#0f172a"} stroke={isSelected ? "#6366f1" : node.stroke || "#f59e0b"} strokeWidth={isSelected ? 2.5 : 2} rx="6" />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center gap-2 font-sans font-bold text-[10px] text-slate-200">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>{node.text}</span>
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  toolbarEntries: [
    {
      id: "aws-lambda-tool",
      type: "node",
      targetType: "aws-lambda",
      label: "Lambda",
      icon: Zap,
      tooltip: "Place an AWS Lambda function node"
    }
  ]
};
export default awsPlugin;
