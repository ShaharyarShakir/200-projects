import { Point, getCenter } from "../geometry";
import { calculateSmartOrthogonalRoute, ObstacleBox } from "./smart";

export type RoutingType = "straight" | "orthogonal" | "curved" | "bezier";

export function calculateStraightRoute(source: Point, target: Point): Point[] {
  return [source, target];
}

export function calculateOrthogonalRoute(
  source: Point,
  target: Point,
  sourceSide?: "N"|"S"|"E"|"W",
  targetSide?: "N"|"S"|"E"|"W",
  obstacles?: ObstacleBox[]
): Point[] {
  if (obstacles && obstacles.length > 0) {
    return calculateSmartOrthogonalRoute(source, target, obstacles);
  }
  // Generate basic orthogonal route points
  const midX = (source.x + target.x) / 2;
  
  // Return simple step-wise orthogonal path
  return [
    source,
    { x: midX, y: source.y },
    { x: midX, y: target.y },
    target
  ];
}

export function calculateBezierRoute(source: Point, target: Point): Point[] {
  const midX = (source.x + target.x) / 2;
  return [
    source,
    { x: midX, y: source.y },
    { x: midX, y: target.y },
    target
  ];
}

export * from "./smart";

export function calculateConnectorPoints(
  source: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number; width: number; height: number }
): Point[] {
  const sc = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const tc = { x: target.x + target.width / 2, y: target.y + target.height / 2 };

  const dx = Math.abs(sc.x - tc.x);
  const dy = Math.abs(sc.y - tc.y);

  if (dx > dy) {
    if (sc.x < tc.x) {
      return [
        { x: source.x + source.width, y: sc.y },
        { x: target.x, y: tc.y },
      ];
    } else {
      return [
        { x: source.x, y: sc.y },
        { x: target.x + target.width, y: tc.y },
      ];
    }
  } else {
    if (sc.y < tc.y) {
      return [
        { x: sc.x, y: source.y + source.height },
        { x: tc.x, y: target.y },
      ];
    } else {
      return [
        { x: sc.x, y: source.y },
        { x: tc.x, y: target.y + target.height },
      ];
    }
  }
}
