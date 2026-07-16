import { GraphEdgeLike } from "../traversal";

export interface NodeDegrees {
  inDegree: number;
  outDegree: number;
  totalDegree: number;
}

export function computeDegrees(nodeIds: string[], edges: GraphEdgeLike[]): Map<string, NodeDegrees> {
  const degreeMap = new Map<string, NodeDegrees>();
  for (const id of nodeIds) {
    degreeMap.set(id, { inDegree: 0, outDegree: 0, totalDegree: 0 });
  }

  for (const edge of edges) {
    const src = degreeMap.get(edge.source);
    const tgt = degreeMap.get(edge.target);

    if (src) {
      src.outDegree += 1;
      src.totalDegree += 1;
    }
    if (tgt) {
      tgt.inDegree += 1;
      tgt.totalDegree += 1;
    }
  }

  return degreeMap;
}

export function computeDensity(nodeCount: number, edgeCount: number, directed = true): number {
  if (nodeCount <= 1) return 0;
  const maxEdges = directed ? nodeCount * (nodeCount - 1) : (nodeCount * (nodeCount - 1)) / 2;
  return edgeCount / maxEdges;
}
