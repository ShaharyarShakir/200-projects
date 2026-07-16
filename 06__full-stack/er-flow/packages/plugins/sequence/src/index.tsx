import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { User, MessageSquare } from "lucide-react";

export const sequencePlugin: DiagramPlugin = {
  id: "sequence",
  name: "Sequence Diagram",
  description: "Illustrate chronological object interactions, lifelines, activation blocks, and call messages.",
  nodeTypes: [
    {
      type: "seq-lifeline",
      label: "Lifeline Participant",
      icon: User,
      defaultWidth: 100,
      defaultHeight: 60,
      createDefault: (id, x, y) => ({
        id,
        type: "seq-lifeline",
        x,
        y,
        width: 100,
        height: 60,
        fill: "rgba(167, 139, 250, 0.1)",
        stroke: "#a78bfa",
        strokeWidth: 2,
        opacity: 1,
        text: "Participant",
      }),
      render: ({ node, isSelected }) => (
        <>
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={node.fill || "#0f172a"}
            stroke={isSelected ? "#6366f1" : node.stroke || "#a78bfa"}
            strokeWidth={isSelected ? 2.5 : 2}
            rx="4"
          />
          <line
            x1={node.x + node.width / 2}
            y1={node.y + node.height}
            x2={node.x + node.width / 2}
            y2={node.y + node.height + 200}
            stroke={node.stroke || "#a78bfa"}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
          <foreignObject x={node.x} y={node.y} width={node.width} height={node.height} style={{ pointerEvents: "none" }}>
            <div className="w-full h-full flex items-center justify-center text-center font-sans font-bold text-xs text-slate-200">
              {node.text}
            </div>
          </foreignObject>
        </>
      )
    }
  ],
  edgeTypes: [
    {
      type: "seq-message",
      label: "Call Message",
      createDefault: (id, source, target) => ({
        id,
        type: "seq-message",
        source,
        target,
        label: "message()",
        points: []
      }),
      render: ({ edge, points, isSelected }) => {
        if (!points || points.length < 2) return null;
        const start = points[0];
        const end = points[points.length - 1];
        const lineStroke = isSelected ? "#6366f1" : "#a78bfa";
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <g>
            <path d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`} fill="none" stroke={lineStroke} strokeWidth={1.5} />
            <polygon points={`${end.x},${end.y} ${end.x - 8},${end.y - 4} ${end.x - 8},${end.y + 4}`} fill={lineStroke} />
            {edge.label && (
              <text x={midX} y={midY - 6} fill="#a78bfa" fontSize="8" textAnchor="middle" fontWeight="semibold">
                {edge.label}
              </text>
            )}
          </g>
        );
      }
    }
  ],
  toolbarEntries: [
    {
      id: "seq-lifeline-tool",
      type: "node",
      targetType: "seq-lifeline",
      label: "Participant",
      icon: User,
      tooltip: "Place a Sequence lifeline participant"
    },
    {
      id: "seq-message-tool",
      type: "edge",
      targetType: "seq-message",
      label: "Message",
      icon: MessageSquare,
      tooltip: "Send message connection between participants"
    }
  ]
};
export default sequencePlugin;
