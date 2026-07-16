import React from "react";
import { DiagramPlugin } from "@eraser/diagram-engine";
import { ErEntityPropertyEditor, ErRelationshipPropertyEditor } from "./properties";
import { validateSchema } from "./validation";
import { generateSql } from "./sql";
import { ER_TEMPLATES } from "./templates";
import { Database, Link } from "lucide-react";

export * from "./types";
export * from "./sql";
export * from "./validation";
export * from "./templates";

export const erPlugin: DiagramPlugin = {
  id: "er",
  name: "Entity Relationship",
  description: "Create relational database schemas, tables, fields, keys, and foreign relationship mappings.",
  nodeTypes: [
    {
      type: "er-entity",
      label: "Table Entity",
      icon: Database,
      defaultWidth: 160,
      defaultHeight: 140,
      createDefault: (id, x, y) => ({
        id,
        type: "er-entity",
        x,
        y,
        width: 160,
        height: 140,
        rotation: 0,
        fill: "#0f172a",
        stroke: "#1e293b",
        strokeWidth: 2,
        opacity: 1,
        text: "NewEntity",
        attributes: [
          {
            id: crypto.randomUUID(),
            name: "id",
            type: "UUID",
            isPk: true,
            isFk: false,
            isNullable: false,
            isUnique: true,
          },
        ],
      }),
      render: ({ node, isSelected }) => {
        const attributes = node.attributes || [];
        return (
          <>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="12"
              ry="12"
              fill={node.fill || "#0f172a"}
              stroke={isSelected ? "#6366f1" : node.stroke || "#1e293b"}
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
              <div className="w-full h-full flex flex-col bg-slate-950/60 rounded-xl overflow-hidden border border-white/5 text-left font-sans select-none">
                <div className="bg-indigo-500/10 border-b border-white/5 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-indigo-300 uppercase tracking-wider truncate">
                    {node.text || "Untitled Entity"}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {attributes.map((attr: any) => (
                    <div
                      key={attr.id}
                      className="flex items-center justify-between text-xs hover:bg-white/5 rounded px-2 py-1 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className={`font-medium truncate ${attr.isPk ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                          {attr.name}
                        </span>
                        {attr.isPk && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded text-[9px] font-extrabold">PK</span>
                        )}
                        {attr.isFk && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded text-[9px] font-extrabold">FK</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                        <span>{attr.type}</span>
                        {attr.isNullable && (
                          <span className="text-[11px] opacity-60">?</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {attributes.length === 0 && (
                    <div className="text-xs text-slate-600 italic text-center py-4">No attributes</div>
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
      type: "er-relationship",
      label: "Relationship",
      createDefault: (id, source, target) => ({
        id,
        type: "er-relationship",
        sourceEntityId: source,
        targetEntityId: target,
        sourceCardinality: "1",
        targetCardinality: "*",
        identifying: true,
        label: "",
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

        const srcLabelPos = { x: start.x + ux * 22, y: start.y + uy * 22 };
        const trgLabelPos = { x: end.x - ux * 22, y: end.y - uy * 22 };
        const midPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

        const lineStroke = isSelected ? "#6366f1" : edge.identifying ? "#818cf8" : "#475569";
        const lineDash = edge.identifying ? "none" : "4,4";

        return (
          <g>
            <path
              d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
              fill="none"
              stroke={lineStroke}
              strokeWidth={isSelected ? 2.5 : 2}
              strokeDasharray={lineDash}
            />

            <g transform={`translate(${srcLabelPos.x}, ${srcLabelPos.y})`}>
              <rect x="-10" y="-9" width="20" height="15" rx="4" fill="#080a0f" stroke={lineStroke} strokeWidth="1" />
              <text textAnchor="middle" alignmentBaseline="middle" y="1" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                {edge.sourceCardinality || "1"}
              </text>
            </g>

            <g transform={`translate(${trgLabelPos.x}, ${trgLabelPos.y})`}>
              <rect x="-10" y="-9" width="20" height="15" rx="4" fill="#080a0f" stroke={lineStroke} strokeWidth="1" />
              <text textAnchor="middle" alignmentBaseline="middle" y="1" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                {edge.targetCardinality || "*"}
              </text>
            </g>

            {edge.label && (
              <g transform={`translate(${midPos.x}, ${midPos.y})`}>
                <rect x="-35" y="-8" width="70" height="16" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text textAnchor="middle" alignmentBaseline="middle" y="1" fill="#e2e8f0" fontSize="8" fontWeight="600" fontFamily="sans-serif">
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
      type: "er-entity",
      component: ErEntityPropertyEditor
    },
    {
      type: "er-relationship",
      component: ErRelationshipPropertyEditor
    }
  ],
  validationRules: [
    {
      id: "er-schema-validation",
      validate: (shapes: any[]) => {
        const erEntities = shapes
          .filter((s) => s.type === "er-entity")
          .map((s) => ({
            id: s.id,
            name: s.text || "Untitled",
            attributes: s.attributes || [],
          }));

        const erRelationships = shapes
          .filter((s) => s.type === "er-relationship")
          .map((s) => ({
            id: s.id,
            sourceEntityId: s.sourceEntityId || s.source,
            targetEntityId: s.targetEntityId || s.target,
            sourceCardinality: s.sourceCardinality || "1",
            targetCardinality: s.targetCardinality || "*",
            identifying: s.identifying ?? true,
            label: s.label || "",
          }));

        const rawErrors = validateSchema(erEntities, erRelationships);
        return rawErrors.map((err) => ({
          id: `${err.targetId}-${err.message}`,
          severity: err.severity === "error" ? "error" : "warning",
          message: err.message,
          elementId: err.targetId
        }));
      }
    }
  ],
  toolbarEntries: [
    {
      id: "er-entity-tool",
      type: "node",
      targetType: "er-entity",
      label: "Table Entity",
      icon: Database,
      tooltip: "Place a Database Table Entity (E)"
    },
    {
      id: "er-relationship-tool",
      type: "edge",
      targetType: "er-relationship",
      label: "Relationship Link",
      icon: Link,
      tooltip: "Connect entities with cardinality relationship (C)"
    }
  ],
  templates: ER_TEMPLATES,
  exporters: [
    {
      id: "er-sql-exporter",
      name: "Export to SQL DDL",
      fileExtension: "sql",
      exportData: async (shapes: any[]) => {
        const erEntities = shapes
          .filter((s) => s.type === "er-entity")
          .map((s) => ({
            id: s.id,
            name: s.text || "Untitled",
            attributes: s.attributes || [],
          }));

        const erRelationships = shapes
          .filter((s) => s.type === "er-relationship")
          .map((s) => ({
            id: s.id,
            sourceEntityId: s.sourceEntityId || s.source,
            targetEntityId: s.targetEntityId || s.target,
            sourceCardinality: s.sourceCardinality || "1",
            targetCardinality: s.targetCardinality || "*",
            identifying: s.identifying ?? true,
            label: s.label || "",
          }));
        return generateSql(erEntities, erRelationships, "postgres");
      }
    }
  ]
};
export default erPlugin;
