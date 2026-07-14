import React from "react";
import { type RendererProps } from "./index";
import { getDiamondPath } from "../geometry";
import { getSelectionBounds } from "../selection";

export const SvgRenderer: React.FC<
  RendererProps & {
    editingShapeId: string | null;
    onTextChange: (id: string, text: string) => void;
    onTextBlur: () => void;
  }
> = ({
  shapes,
  camera,
  selectedIds,
  gridMode,
  marquee,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  editingShapeId,
  onTextChange,
  onTextBlur,
}) => {
  const spacing = 40;

  return (
    <svg
      width="100%"
      height="100%"
      style={{
        display: "block",
        cursor: camera.zoom > 1 ? "default" : "grab",
        userSelect: "none",
        backgroundColor: "#080a0f", // Premium deep dark theme background
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* 1. Grid Background Patterns */}
      <defs>
        {gridMode === "line" && (
          <pattern
            id="grid-lines"
            width={spacing * camera.zoom}
            height={spacing * camera.zoom}
            patternUnits="userSpaceOnUse"
            x={camera.x}
            y={camera.y}
          >
            <path
              d={`M ${spacing * camera.zoom} 0 L 0 0 0 ${spacing * camera.zoom}`}
              fill="none"
              stroke="#1e293b" // Slate-800 subtle lines
              strokeWidth="1"
            />
          </pattern>
        )}

        {gridMode === "dot" && (
          <pattern
            id="grid-dots"
            width={spacing * camera.zoom}
            height={spacing * camera.zoom}
            patternUnits="userSpaceOnUse"
            x={camera.x}
            y={camera.y}
          >
            <circle cx="1.5" cy="1.5" r="1.2" fill="#334155" />
          </pattern>
        )}
      </defs>

      {/* Grid Overlay */}
      {gridMode !== "none" && (
        <rect
          width="100%"
          height="100%"
          fill={gridMode === "line" ? "url(#grid-lines)" : "url(#grid-dots)"}
          pointerEvents="none"
        />
      )}

      {/* 2. Main Camera Group (Handles Zoom/Pan) */}
      <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
        {shapes.map((shape) => {
          const cx = shape.x + shape.width / 2;
          const cy = shape.y + shape.height / 2;
          const isSelected = selectedIds.has(shape.id);

          // Shared properties
          const strokeColor = shape.stroke;
          const fillColor = shape.fill;
          const strokeWidth = shape.strokeWidth;
          const opacity = shape.opacity;
          const transform = `rotate(${shape.rotation} ${cx} ${cy})`;

          return (
            <g key={shape.id} id={`shape-${shape.id}`}>
              {/* Rectangle */}
              {shape.type === "rectangle" && (
                <rect
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  rx="6"
                  ry="6"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  transform={transform}
                />
              )}

              {/* Circle */}
              {shape.type === "circle" && (
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={shape.width / 2}
                  ry={shape.height / 2}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  transform={transform}
                />
              )}

              {/* Diamond */}
              {shape.type === "diamond" && (
                <path
                  d={getDiamondPath(shape)}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  transform={transform}
                />
              )}

              {/* Sticky Note */}
              {shape.type === "sticky" && (
                <rect
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  transform={transform}
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
                />
              )}

              {/* Text / Sticky Note Label Overlay */}
              {(shape.type === "rectangle" ||
                shape.type === "circle" ||
                shape.type === "diamond" ||
                shape.type === "sticky" ||
                shape.type === "text") && (
                <foreignObject
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  transform={transform}
                  style={{ opacity, pointerEvents: "none" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "8px",
                      boxSizing: "border-box",
                      overflow: "hidden",
                    }}
                  >
                    {editingShapeId === shape.id ? (
                      <textarea
                        autoFocus
                        defaultValue={shape.text || ""}
                        onChange={(e) => onTextChange(shape.id, e.target.value)}
                        onBlur={onTextBlur}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onTextBlur();
                          }
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid #6366f1",
                          borderRadius: "4px",
                          color: "#fff",
                          fontFamily: "sans-serif",
                          fontSize: shape.type === "text" ? "14px" : "12px",
                          textAlign: "center",
                          resize: "none",
                          outline: "none",
                          pointerEvents: "auto",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: shape.type === "text" ? shape.stroke : "#1e293b",
                          fontWeight: "600",
                          fontSize: shape.type === "text" ? "14px" : "12px",
                          fontFamily: "sans-serif",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          // Make text white inside dark filled shapes
                          filter:
                            shape.fill !== "transparent" && shape.type !== "text"
                              ? "contrast(2) invert(1)"
                              : "none",
                        }}
                      >
                        {shape.text}
                      </span>
                    )}
                  </div>
                </foreignObject>
              )}

              {/* Line / Arrow */}
              {(shape.type === "line" || shape.type === "arrow") &&
                shape.points &&
                shape.points.length >= 2 && (
                  <g opacity={opacity}>
                    <path
                      d={`M ${shape.points[0].x} ${shape.points[0].y} L ${
                        shape.points[shape.points.length - 1].x
                      } ${shape.points[shape.points.length - 1].y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />

                    {/* Arrowhead */}
                    {shape.type === "arrow" && (
                      (() => {
                        const p1 = shape.points[0];
                        const p2 = shape.points[shape.points.length - 1];
                        const dx = p2.x - p1.x;
                        const dy = p2.y - p1.y;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        if (len > 5) {
                          const arrowLen = 12;
                          const arrowAngle = 25;
                          const angle = Math.atan2(dy, dx);
                          const angleRad = (arrowAngle * Math.PI) / 180;

                          const leftX = p2.x - arrowLen * Math.cos(angle - angleRad);
                          const leftY = p2.y - arrowLen * Math.sin(angle - angleRad);
                          const rightX = p2.x - arrowLen * Math.cos(angle + angleRad);
                          const rightY = p2.y - arrowLen * Math.sin(angle + angleRad);

                          return (
                            <polygon
                              points={`${p2.x},${p2.y} ${leftX},${leftY} ${rightX},${rightY}`}
                              fill={strokeColor}
                            />
                          );
                        }
                        return null;
                      })()
                    )}
                  </g>
                )}

              {/* ER Entity Shape */}
              {shape.type === "er-entity" && (
                <g transform={transform}>
                  {/* Entity outer box */}
                  <rect
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    rx="12"
                    ry="12"
                    fill={fillColor || "#0f172a"}
                    stroke={isSelected ? "#6366f1" : strokeColor || "#1e293b"}
                    strokeWidth={isSelected ? strokeWidth + 0.5 : strokeWidth}
                    opacity={opacity}
                  />
                  {/* Render Table Structure */}
                  <foreignObject
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    style={{ pointerEvents: "none", opacity }}
                  >
                    <div className="w-full h-full flex flex-col bg-slate-950/60 rounded-xl overflow-hidden border border-white/5 text-left font-sans select-none">
                      {/* Entity Title Header */}
                      <div className="bg-indigo-500/10 border-b border-white/5 px-3 py-2 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-indigo-300 uppercase tracking-wider truncate">
                          {shape.text || "Untitled Entity"}
                        </span>
                      </div>
                      
                      {/* Attributes list */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {((shape as any).attributes || []).map((attr: any) => (
                          <div
                            key={attr.id}
                            className="flex items-center justify-between text-xs hover:bg-white/5 rounded px-2 py-1 transition-colors"
                          >
                            {/* Attribute Name and Keys */}
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

                            {/* Attribute Type & Nullability */}
                            <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                              <span>{attr.type}</span>
                              {attr.isNullable && (
                                <span className="text-[11px] opacity-60">?</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!(shape as any).attributes || (shape as any).attributes.length === 0) && (
                          <div className="text-xs text-slate-600 italic text-center py-4">No attributes</div>
                        )}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )}

              {/* ER Relationship Shape */}
              {shape.type === "er-relationship" &&
                shape.points &&
                shape.points.length >= 2 && (
                  (() => {
                    const start = shape.points[0];
                    const end = shape.points[1];
                    const isRelSelected = selectedIds.has(shape.id);

                    const dx = end.x - start.x;
                    const dy = end.y - start.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    
                    const ux = len > 0 ? dx / len : 0;
                    const uy = len > 0 ? dy / len : 0;

                    // Compute cardinality label positions shifted slightly towards endpoints
                    const srcLabelPos = { x: start.x + ux * 22, y: start.y + uy * 22 };
                    const trgLabelPos = { x: end.x - ux * 22, y: end.y - uy * 22 };
                    const midPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

                    const lineStroke = isRelSelected ? "#6366f1" : (shape as any).identifying ? "#818cf8" : "#475569";
                    const lineDash = (shape as any).identifying ? "none" : "4,4";

                    return (
                      <g key={shape.id} opacity={opacity}>
                        {/* Main Link Line */}
                        <path
                          d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                          fill="none"
                          stroke={lineStroke}
                          strokeWidth={isRelSelected ? 2.5 : 2}
                          strokeDasharray={lineDash}
                        />

                        {/* Source Cardinality Label Notch */}
                        <g transform={`translate(${srcLabelPos.x}, ${srcLabelPos.y})`}>
                          <rect
                            x="-10"
                            y="-9"
                            width="20"
                            height="15"
                            rx="4"
                            fill="#080a0f"
                            stroke={lineStroke}
                            strokeWidth="1"
                          />
                          <text
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            y="1"
                            fill="#94a3b8"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {(shape as any).sourceCardinality || "1"}
                          </text>
                        </g>

                        {/* Target Cardinality Label Notch */}
                        <g transform={`translate(${trgLabelPos.x}, ${trgLabelPos.y})`}>
                          <rect
                            x="-10"
                            y="-9"
                            width="20"
                            height="15"
                            rx="4"
                            fill="#080a0f"
                            stroke={lineStroke}
                            strokeWidth="1"
                          />
                          <text
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            y="1"
                            fill="#94a3b8"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {(shape as any).targetCardinality || "1"}
                          </text>
                        </g>

                        {/* Middle optional Label */}
                        {(shape as any).label && (
                          <g transform={`translate(${midPos.x}, ${midPos.y})`}>
                            <rect
                              x="-35"
                              y="-8"
                              width="70"
                              height="16"
                              rx="8"
                              fill="#0f172a"
                              stroke="#334155"
                              strokeWidth="1"
                            />
                            <text
                              textAnchor="middle"
                              alignmentBaseline="middle"
                              y="1"
                              fill="#e2e8f0"
                              fontSize="8"
                              fontWeight="600"
                              fontFamily="sans-serif"
                            >
                              {(shape as any).label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })()
                )}

              {/* Individual Shape Selection Box (inside zoomed group to match rotation) */}
              {isSelected && !editingShapeId && (
                <g>
                  {shape.type !== "arrow" && shape.type !== "line" && shape.type !== "er-relationship" ? (
                    <g transform={transform}>
                      {/* Selection Bounding Rect */}
                      <rect
                        x={shape.x}
                        y={shape.y}
                        width={shape.width}
                        height={shape.height}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth={1.5 / camera.zoom}
                        strokeDasharray={`${4 / camera.zoom},${4 / camera.zoom}`}
                      />

                      {/* 8 Resize Dots */}
                      {(
                        [
                          { x: shape.x, y: shape.y }, // nw
                          { x: shape.x + shape.width / 2, y: shape.y }, // n
                          { x: shape.x + shape.width, y: shape.y }, // ne
                          { x: shape.x + shape.width, y: shape.y + shape.height / 2 }, // e
                          { x: shape.x + shape.width, y: shape.y + shape.height }, // se
                          { x: shape.x + shape.width / 2, y: shape.y + shape.height }, // s
                          { x: shape.x, y: shape.y + shape.height }, // sw
                          { x: shape.x, y: shape.y + shape.height / 2 }, // w
                        ]
                      ).map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r={4.5 / camera.zoom}
                          fill="#ffffff"
                          stroke="#6366f1"
                          strokeWidth={1.5 / camera.zoom}
                        />
                      ))}
                    </g>
                  ) : (
                    // Selection dots for endpoints of lines/arrows
                    shape.points &&
                    shape.points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={5 / camera.zoom}
                        fill="#ffffff"
                        stroke="#6366f1"
                        strokeWidth={1.5 / camera.zoom}
                      />
                    ))
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* 3. Multi-Selection Bounding Box Overlay */}
        {selectedIds.size > 1 &&
          (() => {
            const selectedShapes = shapes.filter((s) => selectedIds.has(s.id));
            const bounds = getSelectionBounds(selectedShapes);
            if (!bounds) return null;

            return (
              <g>
                <rect
                  x={bounds.x}
                  y={bounds.y}
                  width={bounds.width}
                  height={bounds.height}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth={1.5 / camera.zoom}
                  strokeDasharray={`${4 / camera.zoom},${4 / camera.zoom}`}
                />
                {/* 8 Resize Dots */}
                {(
                  [
                    { x: bounds.x, y: bounds.y }, // nw
                    { x: bounds.x + bounds.width / 2, y: bounds.y }, // n
                    { x: bounds.x + bounds.width, y: bounds.y }, // ne
                    { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // e
                    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // se
                    { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // s
                    { x: bounds.x, y: bounds.y + bounds.height }, // sw
                    { x: bounds.x, y: bounds.y + bounds.height / 2 }, // w
                  ]
                ).map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={4.5 / camera.zoom}
                    fill="#ffffff"
                    stroke="#818cf8"
                    strokeWidth={1.5 / camera.zoom}
                  />
                ))}
              </g>
            );
          })()}
      </g>

      {/* 4. Marquee Selection Rectangle (Drawn in screen space for crispness, or world space, world space is fine because it translates with pan/zoom) */}
      {marquee && (
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
          <rect
            x={Math.min(marquee.start.x, marquee.end.x)}
            y={Math.min(marquee.start.y, marquee.end.y)}
            width={Math.abs(marquee.start.x - marquee.end.x)}
            height={Math.abs(marquee.start.y - marquee.end.y)}
            fill="rgba(99, 102, 241, 0.08)"
            stroke="#6366f1"
            strokeWidth={1.5 / camera.zoom}
          />
        </g>
      )}
    </svg>
  );
};
