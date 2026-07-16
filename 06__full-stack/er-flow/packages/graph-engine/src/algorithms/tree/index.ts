import { GraphEdgeLike } from "../../traversal";

export function findTreeRoots(nodeIds: string[], edges: GraphEdgeLike[]): string[] {
  const targets = new Set<string>();
  for (const edge of edges) {
    targets.add(edge.target);
  }
  return nodeIds.filter(id => !targets.has(id));
}

export function getTreeHierarchy(nodeIds: string[], edges: GraphEdgeLike[]): Map<string, string[]> {
  const parentToChildren = new Map<string, string[]>();
  for (const id of nodeIds) {
    parentToChildren.set(id, []);
  }
  for (const edge of edges) {
    if (parentToChildren.has(edge.source)) {
      parentToChildren.get(edge.source)!.push(edge.target);
    }
  }
  return parentToChildren;
}

export * from "./layout";
