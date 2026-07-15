import type { Point, Shape } from "../models";
import { rotatePoint } from "../geometry";

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export function getShapeCorners(shape: { x: number; y: number; width: number; height: number; rotation: number }): Point[] {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const corners = [
    { x: shape.x, y: shape.y },
    { x: shape.x + shape.width, y: shape.y },
    { x: shape.x + shape.width, y: shape.y + shape.height },
    { x: shape.x, y: shape.y + shape.height },
  ];
  return corners.map((c) => rotatePoint(c, { x: cx, y: cy }, shape.rotation));
}

export function getShapeAABB(shape: Shape): { x: number; y: number; width: number; height: number } {
  if (shape.type === 'arrow' || shape.type === 'line' || shape.type === 'er-relationship') {
    const pts = shape.points || [];
    if (pts.length === 0) {
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  const corners = getShapeCorners(shape);
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function getSelectionBounds(selectedShapes: Shape[]): SelectionBounds | null {
  if (selectedShapes.length === 0) return null;

  if (selectedShapes.length === 1) {
    const shape = selectedShapes[0];
    if (shape.type === 'arrow' || shape.type === 'line' || shape.type === 'er-relationship') {
      const aabb = getShapeAABB(shape);
      return { ...aabb, rotation: 0 };
    }
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation,
    };
  }

  // Multi-selection is always axis-aligned
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const shape of selectedShapes) {
    const aabb = getShapeAABB(shape);
    minX = Math.min(minX, aabb.x);
    maxX = Math.max(maxX, aabb.x + aabb.width);
    minY = Math.min(minY, aabb.y);
    maxY = Math.max(maxY, aabb.y + aabb.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rotation: 0,
  };
}

export function getResizeHandles(bounds: SelectionBounds): Record<ResizeHandleType, Point> {
  const { x, y, width, height, rotation } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Axis-aligned positions relative to bounding box
  const rawHandles: Record<ResizeHandleType, Point> = {
    nw: { x, y },
    n: { x: x + width / 2, y },
    ne: { x: x + width, y },
    e: { x: x + width, y: y + height / 2 },
    se: { x: x + width, y: y + height },
    s: { x: x + width / 2, y: y + height },
    sw: { x, y: y + height },
    w: { x, y: y + height / 2 },
  };

  // Rotate each handle point around selection center if rotation is non-zero
  const handles = {} as Record<ResizeHandleType, Point>;
  for (const key of Object.keys(rawHandles) as ResizeHandleType[]) {
    handles[key] = rotatePoint(rawHandles[key], { x: cx, y: cy }, rotation);
  }

  return handles;
}

export function getHandleAtPoint(
  pt: Point,
  bounds: SelectionBounds,
  zoom: number,
  clickRadius = 8
): ResizeHandleType | null {
  const handles = getResizeHandles(bounds);
  const scaledRadius = clickRadius / zoom;

  for (const [key, handlePt] of Object.entries(handles) as [ResizeHandleType, Point][]) {
    const dx = pt.x - handlePt.x;
    const dy = pt.y - handlePt.y;
    if (Math.sqrt(dx * dx + dy * dy) <= scaledRadius) {
      return key;
    }
  }

  return null;
}
