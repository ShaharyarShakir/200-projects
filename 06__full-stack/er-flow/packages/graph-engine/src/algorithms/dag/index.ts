import { GraphEdgeLike } from "../../traversal";

export function topologicalSort(nodeIds: string[], edges: GraphEdgeLike[]): string[] {
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodeIds) {
    adj.set(node, []);
    inDegree.set(node, 0);
  }

  for (const edge of edges) {
    if (adj.has(edge.source) && inDegree.has(edge.target)) {
      adj.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
    }
  }

  const queue: string[] = [];
  for (const node of nodeIds) {
    if (inDegree.get(node) === 0) {
      queue.push(node);
    }
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      inDegree.set(v, inDegree.get(v)! - 1);
      if (inDegree.get(v) === 0) {
        queue.push(v);
      }
    }
  }

  if (order.length !== nodeIds.length) {
    // Cycle detected, return elements in partial order
  }

  return order;
}
