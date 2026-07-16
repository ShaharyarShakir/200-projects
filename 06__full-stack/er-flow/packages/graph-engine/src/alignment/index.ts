import { Point } from "../geometry";

export interface AlignBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function alignSelectedNodes(
  rects: AlignBox[],
  type: "left" | "right" | "center" | "top" | "bottom" | "middle"
): Map<string, Point> {
  const result = new Map<string, Point>();
  if (rects.length <= 1) {
    for (const r of rects) result.set(r.id, { x: r.x, y: r.y });
    return result;
  }

  const minX = Math.min(...rects.map((r) => r.x));
  const maxX = Math.max(...rects.map((r) => r.x + r.width));
  const avgCenterX = rects.reduce((acc, r) => acc + r.x + r.width / 2, 0) / rects.length;

  const minY = Math.min(...rects.map((r) => r.y));
  const maxY = Math.max(...rects.map((r) => r.y + r.height));
  const avgMiddleY = rects.reduce((acc, r) => acc + r.y + r.height / 2, 0) / rects.length;

  for (const r of rects) {
    let nextX = r.x;
    let nextY = r.y;

    if (type === "left") nextX = minX;
    else if (type === "right") nextX = maxX - r.width;
    else if (type === "center") nextX = avgCenterX - r.width / 2;
    else if (type === "top") nextY = minY;
    else if (type === "bottom") nextY = maxY - r.height;
    else if (type === "middle") nextY = avgMiddleY - r.height / 2;

    result.set(r.id, { x: nextX, y: nextY });
  }

  return result;
}

export function distributeSelectedNodes(
  rects: AlignBox[],
  direction: "horizontal" | "vertical"
): Map<string, Point> {
  const result = new Map<string, Point>();
  if (rects.length <= 2) {
    for (const r of rects) result.set(r.id, { x: r.x, y: r.y });
    return result;
  }

  if (direction === "horizontal") {
    const sorted = [...rects].sort((a, b) => a.x - b.x);
    const leftmost = sorted[0];
    const rightmost = sorted[sorted.length - 1];

    const minX = leftmost.x;
    const maxX = rightmost.x + rightmost.width;

    const totalShapeWidth = sorted.reduce((acc, r) => acc + r.width, 0);
    const totalGapWidth = maxX - minX - totalShapeWidth;
    const gap = totalGapWidth / (sorted.length - 1);

    let currentX = minX;
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      result.set(r.id, { x: currentX, y: r.y });
      currentX += r.width + gap;
    }
  } else {
    const sorted = [...rects].sort((a, b) => a.y - b.y);
    const topmost = sorted[0];
    const bottommost = sorted[sorted.length - 1];

    const minY = topmost.y;
    const maxY = bottommost.y + bottommost.height;

    const totalShapeHeight = sorted.reduce((acc, r) => acc + r.height, 0);
    const totalGapHeight = maxY - minY - totalShapeHeight;
    const gap = totalGapHeight / (sorted.length - 1);

    let currentY = minY;
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      result.set(r.id, { x: r.x, y: currentY });
      currentY += r.height + gap;
    }
  }

  return result;
}
