import type { Point } from "../models";

export function snapToValue(val: number, snapSize: number): number {
  if (snapSize <= 0) return val;
  return Math.round(val / snapSize) * snapSize;
}

export function snapPoint(pt: Point, snapSize: number): Point {
  if (snapSize <= 0) return pt;
  return {
    x: snapToValue(pt.x, snapSize),
    y: snapToValue(pt.y, snapSize),
  };
}
