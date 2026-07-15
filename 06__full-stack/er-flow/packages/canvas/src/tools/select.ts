import { BaseTool, type ToolContext } from "./base";
import { type Point, type Shape } from "../models";
import { getHandleAtPoint, getSelectionBounds, getShapeAABB, type ResizeHandleType } from "../selection";
import {
  isPointInRect,
  isPointInCircle,
  isPointInDiamond,
  isPointNearLine,
  rectsIntersect,
  rotatePoint,
} from "../geometry";

export class SelectTool extends BaseTool {
  private mode: "none" | "drag" | "resize" | "marquee" = "none";
  private startPoint: Point | null = null;
  private lastPoint: Point | null = null;
  private resizeHandle: ResizeHandleType | null = null;

  // Store starting geometries
  private startGeometries = new Map<
    string,
    { x: number; y: number; width: number; height: number; points?: Point[] }
  >();
  private startSelectionBounds: { x: number; y: number; width: number; height: number; rotation: number } | null = null;

  constructor() {
    super("select");
  }

  private hitTest(pt: Point, shape: Shape): boolean {
    switch (shape.type) {
      case "rectangle":
      case "text":
      case "sticky":
      case "image":
      case "er-entity":
        return isPointInRect(pt, shape);
      case "circle":
        return isPointInCircle(pt, shape);
      case "diamond":
        return isPointInDiamond(pt, shape);
      case "arrow":
      case "line":
      case "er-relationship":
        return isPointNearLine(pt, (shape as any).points || [], 8);
      default:
        return false;
    }
  }

  override onPointerDown(ctx: ToolContext): void {
    const { point, engine } = ctx;
    this.startPoint = { ...point };
    this.lastPoint = { ...point };

    const selectedShapes = engine.getSelectedShapes();
    const selectionBounds = getSelectionBounds(selectedShapes);

    // 1. Check if clicking on a selection resize handle
    if (selectionBounds) {
      const containerRect = engine.getContainerRect();
      if (containerRect) {
        const handle = getHandleAtPoint(point, selectionBounds, engine.camera.zoom);
        if (handle) {
          this.mode = "resize";
          this.resizeHandle = handle;
          this.startSelectionBounds = { ...selectionBounds };

          // Save start geometries of selected shapes
          this.startGeometries.clear();
          for (const s of selectedShapes) {
            this.startGeometries.set(s.id, {
              x: s.x,
              y: s.y,
              width: s.width,
              height: s.height,
              points: s.type === "arrow" || s.type === "line" ? s.points.map((p) => ({ ...p })) : undefined,
            });
          }
          return;
        }
      }
    }

    // 2. Check if clicking on any shape (reverse order for top-most selection)
    const shapes = engine.getShapes();
    let clickedShape: Shape | null = null;
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (this.hitTest(point, shapes[i])) {
        clickedShape = shapes[i];
        break;
      }
    }

    if (clickedShape) {
      this.mode = "drag";
      const isAlreadySelected = engine.selectedIds.has(clickedShape.id);

      if (ctx.event.shiftKey) {
        // Toggle selection
        if (isAlreadySelected) {
          engine.deselectShape(clickedShape.id);
        } else {
          engine.selectShape(clickedShape.id, true);
        }
      } else {
        // Direct selection if not already selected
        if (!isAlreadySelected) {
          engine.selectShape(clickedShape.id, false);
        }
      }

      // Store current shapes' starting geometries for move operation
      this.startGeometries.clear();
      const currentSelection = engine.getSelectedShapes();
      for (const s of currentSelection) {
        this.startGeometries.set(s.id, {
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          points: s.type === "arrow" || s.type === "line" ? s.points.map((p) => ({ ...p })) : undefined,
        });
      }
    } else {
      // 3. Clicked empty canvas space
      if (!ctx.event.shiftKey) {
        engine.clearSelection();
      }
      this.mode = "marquee";
      engine.setMarquee({
        start: { ...point },
        end: { ...point },
      });
    }
  }

  override onPointerMove(ctx: ToolContext): void {
    if (!this.startPoint || !this.lastPoint) return;
    const { point, engine } = ctx;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    if (this.mode === "drag") {
      // Move all selected shapes
      const selectedShapes = engine.getSelectedShapes();
      engine.transact(() => {
        for (const s of selectedShapes) {
          const startGeo = this.startGeometries.get(s.id);
          if (!startGeo) continue;

          if (s.type === "arrow" || s.type === "line") {
            const startPts = startGeo.points || [];
            const movedPts = startPts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
            engine.updateShape(s.id, { points: movedPts });
          } else {
            engine.updateShape(s.id, {
              x: startGeo.x + dx,
              y: startGeo.y + dy,
            });
          }
        }
      });
    } else if (this.mode === "resize" && this.resizeHandle && this.startSelectionBounds) {
      const selectedShapes = engine.getSelectedShapes();
      const bounds = this.startSelectionBounds;

      engine.transact(() => {
        if (selectedShapes.length === 1) {
          const shape = selectedShapes[0];
          const startGeo = this.startGeometries.get(shape.id);
          if (!startGeo) return;

          // Single shape resize
          if (shape.type === "arrow" || shape.type === "line") {
            // Resize points bounds or just move endpoints
            const startPts = startGeo.points || [];
            if (startPts.length >= 2) {
              const head = startPts[0];
              const tail = startPts[startPts.length - 1];

              // Resize line/arrow by dragging endpoints
              if (this.resizeHandle === "nw" || this.resizeHandle === "w" || this.resizeHandle === "n") {
                // Move start point
                const nextPts = [...startPts];
                nextPts[0] = { x: head.x + dx, y: head.y + dy };
                engine.updateShape(shape.id, { points: nextPts });
              } else if (this.resizeHandle === "se" || this.resizeHandle === "e" || this.resizeHandle === "s") {
                // Move end point
                const nextPts = [...startPts];
                nextPts[nextPts.length - 1] = { x: tail.x + dx, y: tail.y + dy };
                engine.updateShape(shape.id, { points: nextPts });
              }
            }
          } else {
            // Rotated single shape resize
            // Rotate mouse delta into local coords
            const localDelta = rotatePoint({ x: dx, y: dy }, { x: 0, y: 0 }, -bounds.rotation);

            let newW = startGeo.width;
            let newH = startGeo.height;
            let newLocalX = 0;
            let newLocalY = 0;

            const handle = this.resizeHandle;
            if (!handle) return;
            if (handle.includes("e")) {
              newW = Math.max(10, startGeo.width + localDelta.x);
            }
            if (handle.includes("w")) {
              const maxW = Math.max(10, startGeo.width - localDelta.x);
              newLocalX = startGeo.width - maxW;
              newW = maxW;
            }
            if (handle.includes("s")) {
              newH = Math.max(10, startGeo.height + localDelta.y);
            }
            if (handle.includes("n")) {
              const maxH = Math.max(10, startGeo.height - localDelta.y);
              newLocalY = startGeo.height - maxH;
              newH = maxH;
            }

            // Un-rotate the local change back to world space
            const offset = rotatePoint({ x: newLocalX, y: newLocalY }, { x: 0, y: 0 }, bounds.rotation);
            const nextX = startGeo.x + offset.x;
            const nextY = startGeo.y + offset.y;

            engine.updateShape(shape.id, {
              x: nextX,
              y: nextY,
              width: newW,
              height: newH,
            });
          }
        } else {
          // Multi-shape resizing (scale all relative to starting bounding box)
          const startBox = bounds;
          const handle = this.resizeHandle;
          if (!handle) return;

          let scaleX = 1;
          let scaleY = 1;
          let originX = startBox.x;
          let originY = startBox.y;

          if (handle.includes("e")) {
            const nextW = Math.max(10, startBox.width + dx);
            scaleX = nextW / startBox.width;
            originX = startBox.x;
          } else if (handle.includes("w")) {
            const nextW = Math.max(10, startBox.width - dx);
            scaleX = nextW / startBox.width;
            originX = startBox.x + startBox.width;
          }

          if (handle.includes("s")) {
            const nextH = Math.max(10, startBox.height + dy);
            scaleY = nextH / startBox.height;
            originY = startBox.y;
          } else if (handle.includes("n")) {
            const nextH = Math.max(10, startBox.height - dy);
            scaleY = nextH / startBox.height;
            originY = startBox.y + startBox.height;
          }

          for (const s of selectedShapes) {
            const startGeo = this.startGeometries.get(s.id);
            if (!startGeo) continue;

            if (s.type === "arrow" || s.type === "line") {
              const pts = startGeo.points || [];
              const scaledPts = pts.map((p) => ({
                x: originX + (p.x - originX) * scaleX,
                y: originY + (p.y - originY) * scaleY,
              }));
              engine.updateShape(s.id, { points: scaledPts });
            } else {
              const newX = originX + (startGeo.x - originX) * scaleX;
              const newY = originY + (startGeo.y - originY) * scaleY;
              const newW = startGeo.width * scaleX;
              const newH = startGeo.height * scaleY;

              engine.updateShape(s.id, {
                x: newW < 0 ? newX + newW : newX,
                y: newH < 0 ? newY + newH : newY,
                width: Math.abs(newW),
                height: Math.abs(newH),
              });
            }
          }
        }
      });
    } else if (this.mode === "marquee") {
      engine.setMarquee({
        start: { ...this.startPoint },
        end: { ...point },
      });
    }

    this.lastPoint = { ...point };
  }

  override onPointerUp(ctx: ToolContext): void {
    const { engine } = ctx;

    if (this.mode === "marquee") {
      const marquee = engine.marquee;
      if (marquee) {
        // Select all shapes that intersect marquee box
        const x1 = Math.min(marquee.start.x, marquee.end.x);
        const y1 = Math.min(marquee.start.y, marquee.end.y);
        const w = Math.abs(marquee.start.x - marquee.end.x);
        const h = Math.abs(marquee.start.y - marquee.end.y);

        const bounds = { x: x1, y: y1, width: w, height: h };

        const toSelect: string[] = [];
        const shapes = engine.getShapes();
        for (const s of shapes) {
          const aabb = getShapeAABB(s);
          if (rectsIntersect(bounds, aabb)) {
            toSelect.push(s.id);
          }
        }

        if (toSelect.length > 0) {
          engine.selectShapes(toSelect);
        }
      }
      engine.setMarquee(null);
    }

    this.mode = "none";
    this.startPoint = null;
    this.lastPoint = null;
    this.resizeHandle = null;
    this.startSelectionBounds = null;
    this.startGeometries.clear();
  }
}
