import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { FlowchartNodePropertyEditor } from "./properties";
import { getDiamondPath, computeDegrees } from "@eraser/graph-engine";
import { PlayCircle, StopCircle, RefreshCw, HelpCircle, ArrowRight } from "lucide-react";

export const flowchartPlugin: DiagramPlugin = {
  id: "flowchart",
  name: "Flowchart",
  description: "Map operations, decision paths, compute steps, processes, and flows.",
  nodeTypes: [
    {
      type: "fc-start",
      label: "Start Node",
      icon: PlayCircle,
      defaultWidth: 100,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "fc-start",
        x,
        y,
        width: 100,
        height: 50,
        rotation: 0,
        fill: "rgba(16, 185, 129, 0.1)",
        stroke: "#10b981",
        strokeWidth: 2,
        opacity: 1,
        text: "Start",
      }),
      render: ({ node, isSelected }) => {
        return (
          <>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={node.height / 2}
              ry={node.height / 2}
              fill={node.fill || "#0f172a"}
              stroke={isSelected ? "#6366f1" : node.stroke || "#10b981"}
              strokeWidth={isSelected ? (node.strokeWidth || 2) + 0.5 : node.strokeWidth || 2}
              opacity={node.opacity ?? 1}
            />
            <foreignObject
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              style={{ pointerEvents: "none", opacity: node.opacity ?? 1 }}
            >
              <div className="w-full h-full flex items-center justify-center text-center font-sans font-bold text-xs text-slate-200">
                {node.text}
              </div>
            </foreignObject>
          </>
        );
      }
    },
    {
      type: "fc-end",
      label: "End Node",
      icon: StopCircle,
      defaultWidth: 100,
      defaultHeight: 50,
      createDefault: (id, x, y) => ({
        id,
        type: "fc-end",
        x,
        y,
        width: 100,
        height: 50,
        rotation: 0,
        fill: "rgba(239, 68, 68, 0.1)",
        stroke: "#ef4444",
        strokeWidth: 2,
        opacity: 1,
        text: "End",
      }),
      render: ({ node, isSelected }) => {
        return (
          <>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={node.height / 2}
              ry={node.height / 2}
              fill={node.fill || "#0f172a"}
              stroke={isSelected ? "#6366f1" : node.stroke || "#ef4444"}
              strokeWidth={isSelected ? (node.strokeWidth || 2) + 0.5 : node.strokeWidth || 2}
              opacity={node.opacity ?? 1}
            />
            <foreignObject
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              style={{ pointerEvents: "none", opacity: node.opacity ?? 1 }}
            >
              <div className="w-full h-full flex items-center justify-center text-center font-sans font-bold text-xs text-slate-200">
                {node.text}
              </div>
            </foreignObject>
          </>
        );
      }
    },
    {
      type: "fc-process",
      label: "Process Node",
      icon: RefreshCw,
      defaultWidth: 120,
      defaultHeight: 60,
      createDefault: (id, x, y) => ({
        id,
        type: "fc-process",
        x,
        y,
        width: 120,
        height: 60,
        rotation: 0,
        fill: "rgba(59, 130, 246, 0.1)",
        stroke: "#3b82f6",
        strokeWidth: 2,
        opacity: 1,
        text: "Compute Step",
      }),
      render: ({ node, isSelected }) => {
        return (
          <>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="4"
              ry="4"
              fill={node.fill || "#0f172a"}
              stroke={isSelected ? "#6366f1" : node.stroke || "#3b82f6"}
              strokeWidth={isSelected ? (node.strokeWidth || 2) + 0.5 : node.strokeWidth || 2}
              opacity={node.opacity ?? 1}
            />
            <foreignObject
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              style={{ pointerEvents: "none", opacity: node.opacity ?? 1 }}
            >
              <div className="w-full h-full flex items-center justify-center text-center font-sans font-semibold text-xs text-slate-200 px-2">
                {node.text}
              </div>
            </foreignObject>
          </>
        );
      }
    },
    {
      type: "fc-decision",
      label: "Decision Node",
      icon: HelpCircle,
      defaultWidth: 100,
      defaultHeight: 80,
      createDefault: (id, x, y) => ({
        id,
        type: "fc-decision",
        x,
        y,
        width: 100,
        height: 80,
        rotation: 0,
        fill: "rgba(249, 115, 22, 0.1)",
        stroke: "#f97316",
        strokeWidth: 2,
        opacity: 1,
        text: "Condition?",
      }),
      render: ({ node, isSelected }) => {
        return (
          <>
            <path
              d={getDiamondPath(node)}
              fill={node.fill || "#0f172a"}
              stroke={isSelected ? "#6366f1" : node.stroke || "#f97316"}
              strokeWidth={isSelected ? (node.strokeWidth || 2) + 0.5 : node.strokeWidth || 2}
              opacity={node.opacity ?? 1}
            />
            <foreignObject
              x={node.x + node.width * 0.15}
              y={node.y + node.height * 0.15}
              width={node.width * 0.7}
              height={node.height * 0.7}
              style={{ pointerEvents: "none", opacity: node.opacity ?? 1 }}
            >
              <div className="w-full h-full flex items-center justify-center text-center font-sans font-semibold text-[11px] text-slate-200">
                {node.text}
              </div>
            </foreignObject>
          </>
        );
      }
    }
  ],
  edgeTypes: [
    {
      type: "fc-connector",
      label: "Flow Connector",
      createDefault: (id, source, target) => ({
        id,
        type: "fc-connector",
        source,
        target,
        label: "",
        points: [],
      }),
      render: ({ edge, points, isSelected }) => {
        if (!points || points.length < 2) return null;
        const start = points[0];
        const end = points[points.length - 1];

        // Draw standard connector with arrow markers
        const lineStroke = isSelected ? "#6366f1" : edge.stroke || "#94a3b8";

        // Draw arrow tip on destination
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = len > 0 ? dx / len : 0;
        const uy = len > 0 ? dy / len : 0;

        const arrowLen = 8;
        const leftX = end.x - arrowLen * (ux - uy * 0.5);
        const leftY = end.y - arrowLen * (uy + ux * 0.5);
        const rightX = end.x - arrowLen * (ux + uy * 0.5);
        const rightY = end.y - arrowLen * (uy - ux * 0.5);

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <g>
            <path
              d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
              fill="none"
              stroke={lineStroke}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            <polygon
              points={`${end.x},${end.y} ${leftX},${leftY} ${rightX},${rightY}`}
              fill={lineStroke}
            />
            {edge.label && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-18" y="-6" width="36" height="12" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
                <text textAnchor="middle" alignmentBaseline="middle" y="0.5" fill="#94a3b8" fontSize="7" fontWeight="bold">
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        );
      }
    }
  ],
  propertyEditors: [
    {
      type: "fc-start",
      component: FlowchartNodePropertyEditor
    },
    {
      type: "fc-end",
      component: FlowchartNodePropertyEditor
    },
    {
      type: "fc-process",
      component: FlowchartNodePropertyEditor
    },
    {
      type: "fc-decision",
      component: FlowchartNodePropertyEditor
    },
    {
      type: "fc-connector",
      component: FlowchartNodePropertyEditor
    }
  ],
  validationRules: [
    {
      id: "flowchart-integrity",
      validate: (shapes: any[]) => {
        const diagnostics: any[] = [];
        const nodes = shapes.filter(s => ["fc-start", "fc-end", "fc-process", "fc-decision"].includes(s.type));
        const connectors = shapes.filter(s => s.type === "fc-connector");

        const hasStart = nodes.some(n => n.type === "fc-start");
        const hasEnd = nodes.some(n => n.type === "fc-end");

        if (nodes.length > 0 && !hasStart) {
          diagnostics.push({
            id: "missing-start",
            severity: "warning",
            message: "Missing 'Start' node in flowchart.",
          });
        }
        if (nodes.length > 0 && !hasEnd) {
          diagnostics.push({
            id: "missing-end",
            severity: "warning",
            message: "Missing 'End' node in flowchart.",
          });
        }

        const nodeIds = nodes.map(n => n.id);
        const edges = connectors.map((c: any) => ({ source: c.source, target: c.target }));
        
        // Find unconnected or dangling flowchart steps
        const degreeMap = computeDegrees(nodeIds, edges);
        for (const [nodeId, deg] of degreeMap.entries()) {
          const node = nodes.find(n => n.id === nodeId);
          if (!node) continue;

          // 1. Unreachable node (has zero in-degree, except Start node)
          if (deg.inDegree === 0 && node.type !== "fc-start") {
            diagnostics.push({
              id: `unreachable-${nodeId}`,
              severity: "warning",
              message: `Flowchart node '${node.text || "unnamed"}' is unreachable (no incoming connections).`,
              elementId: nodeId
            });
          }

          // 2. Dead decision node (has zero out-degree)
          if (deg.outDegree === 0 && node.type === "fc-decision") {
            diagnostics.push({
              id: `dead-decision-${nodeId}`,
              severity: "error",
              message: `Decision node '${node.text || "unnamed"}' has no outcome branches.`,
              elementId: nodeId
            });
          }
        }

        return diagnostics;
      }
    }
  ],
  toolbarEntries: [
    {
      id: "fc-start-tool",
      type: "node",
      targetType: "fc-start",
      label: "Start Node",
      icon: PlayCircle,
      tooltip: "Place a Flowchart Start capsule"
    },
    {
      id: "fc-process-tool",
      type: "node",
      targetType: "fc-process",
      label: "Process Node",
      icon: RefreshCw,
      tooltip: "Place an Action Process step"
    },
    {
      id: "fc-decision-tool",
      type: "node",
      targetType: "fc-decision",
      label: "Decision Node",
      icon: HelpCircle,
      tooltip: "Place a Diamond Decision branching step"
    },
    {
      id: "fc-end-tool",
      type: "node",
      targetType: "fc-end",
      label: "End Node",
      icon: StopCircle,
      tooltip: "Place a Flowchart End capsule"
    },
    {
      id: "fc-connector-tool",
      type: "edge",
      targetType: "fc-connector",
      label: "Connector Link",
      icon: ArrowRight,
      tooltip: "Connect steps with sequential arrows"
    }
  ]
};
export default flowchartPlugin;
