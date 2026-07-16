import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { UmlClassPropertyEditor } from "./properties";
import { detectCycles } from "@eraser/graph-engine";
import { Box, ArrowUpRight, HelpCircle } from "lucide-react";

export const umlPlugin: DiagramPlugin = {
  id: "uml",
  name: "UML Class Diagram",
  description: "Create object-oriented systems modeling, UML classes, interfaces, attributes, and inheritance.",
  nodeTypes: [
    {
      type: "uml-class",
      label: "UML Class",
      icon: Box,
      defaultWidth: 160,
      defaultHeight: 180,
      createDefault: (id, x, y) => ({
        id,
        type: "uml-class",
        x,
        y,
        width: 160,
        height: 180,
        rotation: 0,
        fill: "#0f172a",
        stroke: "#3b82f6",
        strokeWidth: 2,
        opacity: 1,
        text: "MyClass",
        fields: ["+ id: UUID", "+ name: String"],
        methods: ["+ save(): void"],
      }),
      render: ({ node, isSelected }) => {
        const fields = node.fields || [];
        const methods = node.methods || [];
        return (
          <>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="6"
              ry="6"
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
              <div className="w-full h-full flex flex-col bg-slate-950/60 rounded-lg overflow-hidden border border-white/5 text-left font-sans select-none text-xs">
                {/* Class Title Header */}
                <div className="bg-blue-500/10 border-b border-blue-900/40 px-3 py-1.5 text-center">
                  <span className="font-extrabold text-blue-300 tracking-wide truncate block">
                    {node.text || "UntitledClass"}
                  </span>
                </div>
                
                {/* Fields compartment */}
                <div className="border-b border-blue-900/35 p-2 space-y-0.5 min-h-[40px] max-h-[70px] overflow-y-auto custom-scrollbar font-mono text-[9px] text-slate-300">
                  {fields.map((f: string, idx: number) => (
                    <div key={idx} className="truncate">{f}</div>
                  ))}
                  {fields.length === 0 && (
                    <div className="text-[8px] text-slate-650 italic">No fields</div>
                  )}
                </div>

                {/* Methods compartment */}
                <div className="p-2 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar font-mono text-[9px] text-slate-350">
                  {methods.map((m: string, idx: number) => (
                    <div key={idx} className="truncate">{m}</div>
                  ))}
                  {methods.length === 0 && (
                    <div className="text-[8px] text-slate-650 italic">No methods</div>
                  )}
                </div>
              </div>
            </foreignObject>
          </>
        );
      }
    }
  ],
  edgeTypes: [
    {
      type: "uml-generalization",
      label: "Generalization / Inheritance",
      createDefault: (id, source, target) => ({
        id,
        type: "uml-generalization",
        source,
        target,
        points: [],
      }),
      render: ({ edge, points, isSelected }) => {
        if (!points || points.length < 2) return null;
        const start = points[0];
        const end = points[points.length - 1];

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = len > 0 ? dx / len : 0;
        const uy = len > 0 ? dy / len : 0;

        const lineStroke = isSelected ? "#6366f1" : "#94a3b8";

        // Draw triangular open arrowhead tip for Generalization/Inheritance
        const arrowLen = 14;
        const arrowAngle = 30; // degrees
        const angle = Math.atan2(dy, dx);
        const angleRad = (arrowAngle * Math.PI) / 180;

        const leftX = end.x - arrowLen * Math.cos(angle - angleRad);
        const leftY = end.y - arrowLen * Math.sin(angle - angleRad);
        const rightX = end.x - arrowLen * Math.cos(angle + angleRad);
        const rightY = end.y - arrowLen * Math.sin(angle + angleRad);

        // Calculate line end slightly offset back from target to avoid sticking through arrowhead
        const lineEndX = end.x - arrowLen * Math.cos(angle) * 0.8;
        const lineEndY = end.y - arrowLen * Math.sin(angle) * 0.8;

        return (
          <g>
            <path
              d={`M ${start.x} ${start.y} L ${lineEndX} ${lineEndY}`}
              fill="none"
              stroke={lineStroke}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            {/* White-filled triangle arrow */}
            <polygon
              points={`${end.x},${end.y} ${leftX},${leftY} ${rightX},${rightY}`}
              fill="#080a0f"
              stroke={lineStroke}
              strokeWidth={1.5}
            />
          </g>
        );
      }
    },
    {
      type: "uml-association",
      label: "Association Link",
      createDefault: (id, source, target) => ({
        id,
        type: "uml-association",
        source,
        target,
        label: "",
        points: [],
      }),
      render: ({ edge, points, isSelected }) => {
        if (!points || points.length < 2) return null;
        const start = points[0];
        const end = points[points.length - 1];

        const lineStroke = isSelected ? "#6366f1" : "#475569";
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
            {edge.label && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-24" y="-7" width="48" height="14" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
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
      type: "uml-class",
      component: UmlClassPropertyEditor
    },
    {
      type: "uml-generalization",
      component: UmlClassPropertyEditor
    },
    {
      type: "uml-association",
      component: UmlClassPropertyEditor
    }
  ],
  validationRules: [
    {
      id: "uml-cyclic-inheritance",
      validate: (shapes: any[]) => {
        const diagnostics: any[] = [];
        const classes = shapes.filter(s => s.type === "uml-class");
        const generalizations = shapes.filter(s => s.type === "uml-generalization");

        const classIds = classes.map(c => c.id);
        const edges = generalizations.map((g: any) => ({
          source: g.source,
          target: g.target
        }));

        const cycles = detectCycles(classIds, edges);
        for (const cycle of cycles) {
          const names = cycle.map(id => {
            const cls = classes.find(c => c.id === id);
            return cls ? (cls.text || "UnnamedClass") : "Class";
          });

          diagnostics.push({
            id: `cyclic-inheritance-${cycle.join("-")}`,
            severity: "error",
            message: `Cyclic inheritance path detected: ${names.join(" -> ")} -> ${names[0]}`,
            elementId: cycle[0]
          });
        }

        return diagnostics;
      }
    }
  ],
  toolbarEntries: [
    {
      id: "uml-class-tool",
      type: "node",
      targetType: "uml-class",
      label: "UML Class",
      icon: Box,
      tooltip: "Place a UML Class representation"
    },
    {
      id: "uml-generalization-tool",
      type: "edge",
      targetType: "uml-generalization",
      label: "Inheritance Link",
      icon: ArrowUpRight,
      tooltip: "Connect subclasses with inheritance triangle arrow"
    },
    {
      id: "uml-association-tool",
      type: "edge",
      targetType: "uml-association",
      label: "Association Link",
      icon: HelpCircle,
      tooltip: "Connect class associations"
    }
  ]
};
export default umlPlugin;
