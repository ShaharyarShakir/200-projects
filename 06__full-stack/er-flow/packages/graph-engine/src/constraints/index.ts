import { Point } from "../geometry";

export interface AlignmentConstraint {
  axis: "x" | "y";
  value: number;
}

export function alignNodes(
  nodePositions: Map<string, Point>,
  alignment: "left" | "right" | "top" | "bottom" | "centerX" | "centerY"
): Map<string, Point> {
  const adjusted = new Map<string, Point>(nodePositions);
  const values = Array.from(nodePositions.values());
  if (values.length === 0) return adjusted;

  let alignVal = 0;
  if (alignment === "left") {
    alignVal = Math.min(...values.map(v => v.x));
    for (const [id, pt] of adjusted.entries()) adjusted.set(id, { x: alignVal, y: pt.y });
  } else if (alignment === "right") {
    alignVal = Math.max(...values.map(v => v.x));
    for (const [id, pt] of adjusted.entries()) adjusted.set(id, { x: alignVal, y: pt.y });
  } else if (alignment === "top") {
    alignVal = Math.min(...values.map(v => v.y));
    for (const [id, pt] of adjusted.entries()) adjusted.set(id, { x: pt.x, y: alignVal });
  } else if (alignment === "bottom") {
    alignVal = Math.max(...values.map(v => v.y));
    for (const [id, pt] of adjusted.entries()) adjusted.set(id, { x: pt.x, y: alignVal });
  }

  return adjusted;
}
