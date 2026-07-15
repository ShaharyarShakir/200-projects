import React from "react";
import { type RendererProps } from "./index";
import { getDiamondPath } from "@eraser/graph-engine";
import { getSelectionBounds } from "../selection";

export const SvgRenderer: React.FC<
  RendererProps & {
    editingShapeId: string | null;
    onTextChange: (id: string, text: string) => void;
    onTextBlur: () => void;
    registry?: any;
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
  registry,
  activeGuides,
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
      className="canvas-viewport"
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

          // Retrieve dynamic renderer from registry
          const nodeDef = registry?.getNodeDefinition(shape.type);
          const edgeDef = registry?.getEdgeDefinition(shape.type);

          return (
            <g key={shape.id} id={`shape-${shape.id}`}>
              {/* Plugin Registered Node */}
              {nodeDef ? (
                <g transform={transform}>
                  {nodeDef.render({
                    node: shape,
                    isSelected,
                    isEditing: editingShapeId === shape.id,
                    zoom: camera.zoom,
                    onChangeText: (text: string) => onTextChange(shape.id, text),
                    onBlurText: onTextBlur,
                  })}
                </g>
              ) : edgeDef ? (
                /* Plugin Registered Edge */
                <g opacity={opacity}>
                  {edgeDef.render ? (
                    edgeDef.render({
                      edge: shape,
                      sourceNode: shapes.find(s => s.id === ((shape as any).sourceEntityId || (shape as any).source)),
                      targetNode: shapes.find(s => s.id === ((shape as any).targetEntityId || (shape as any).target)),
                      points: (shape as any).points || [],
                      isSelected,
                    })
                  ) : (
                    // Default fallback line path for edge
                    shape.points && shape.points.length >= 2 && (
                      <path
                        d={`M ${shape.points[0].x} ${shape.points[0].y} L ${
                          shape.points[shape.points.length - 1].x
                        } ${shape.points[shape.points.length - 1].y}`}
                        fill="none"
                        stroke={strokeColor || "#818cf8"}
                        strokeWidth={strokeWidth || 2}
                      />
                    )
                  )}
                </g>
              ) : (
                /* Fallbacks for primitive shapes */
                <>
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
                </>
              )}

              {/* Individual Shape Selection Box (inside zoomed group to match rotation) */}
              {isSelected && !editingShapeId && (
                <g>
                  {shape.type !== "arrow" && shape.type !== "line" && !edgeDef ? (
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
                    // Selection dots for endpoints of lines/arrows/edges
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

        {/* Alignment Snapping Guides */}
        {activeGuides &&
          activeGuides.map((guide, idx) => (
            <line
              key={idx}
              x1={guide.x1}
              y1={guide.y1}
              x2={guide.x2}
              y2={guide.y2}
              stroke="#f43f5e"
              strokeWidth={1.5 / camera.zoom}
              strokeDasharray={`${4 / camera.zoom},${4 / camera.zoom}`}
            />
          ))}
      </g>

      {/* 4. Marquee Selection Rectangle */}
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
