import { Point } from "../geometry";
import { GraphEdgeLike } from "../traversal";
import { computeForceLayout } from "../algorithms/force";
import { computeLayeredLayout } from "../algorithms/layered";
import { computeTreeLayout } from "../algorithms/tree";
import { computeCircularLayout } from "../algorithms/circular";
import { computeGridLayout } from "../algorithms/grid";

export type LayoutMode = "force" | "layered" | "orthogonal" | "tree" | "circular" | "grid";

export interface LayoutOptions {
  mode: LayoutMode;
  width?: number;
  height?: number;
  damping?: number;
  cols?: number;
}

export function performLayout(
  nodes: { id: string; x: number; y: number; width: number; height: number }[],
  edges: GraphEdgeLike[],
  options: LayoutOptions
): Map<string, Point> {
  const ids = nodes.map(n => n.id);

  if (options.mode === "layered") {
    return computeLayeredLayout(ids, edges);
  } else if (options.mode === "tree") {
    return computeTreeLayout(ids, edges);
  } else if (options.mode === "circular") {
    return computeCircularLayout(ids);
  } else if (options.mode === "grid" || options.mode === "orthogonal") {
    return computeGridLayout(ids, options.cols || Math.ceil(Math.sqrt(nodes.length)));
  } else {
    const initialPositions = new Map<string, Point>();
    for (const n of nodes) {
      initialPositions.set(n.id, { x: n.x, y: n.y });
    }
    return computeForceLayout(ids, edges, initialPositions);
  }
}
