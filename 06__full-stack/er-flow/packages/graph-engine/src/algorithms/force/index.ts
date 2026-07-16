import { Point } from "../../geometry";
import { GraphEdgeLike } from "../../traversal";

export interface ForceLayoutNode {
  id: string;
  x: number;
  y: number;
  fx?: number;
  fy?: number;
}

export function computeForceLayoutStep(
  nodes: ForceLayoutNode[],
  edges: GraphEdgeLike[],
  repulsionConstant = 1000,
  attractionConstant = 0.05,
  damping = 0.85
): ForceLayoutNode[] {
  const forces = new Map<string, Point>();
  for (const node of nodes) {
    forces.set(node.id, { x: 0, y: 0 });
  }

  // 1. Repulsive forces between all node pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const distSq = dx * dx + dy * dy || 1;
      const dist = Math.sqrt(distSq);

      const f = repulsionConstant / distSq;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;

      const force1 = forces.get(n1.id)!;
      const force2 = forces.get(n2.id)!;

      force1.x -= fx;
      force1.y -= fy;
      force2.x += fx;
      force2.y += fy;
    }
  }

  // 2. Attractive forces along edges
  for (const edge of edges) {
    const n1 = nodes.find(n => n.id === edge.source);
    const n2 = nodes.find(n => n.id === edge.target);
    if (!n1 || !n2) continue;

    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const f = attractionConstant * dist;
    const fx = (dx / dist) * f;
    const fy = (dy / dist) * f;

    const force1 = forces.get(n1.id)!;
    const force2 = forces.get(n2.id)!;

    force1.x += fx;
    force1.y += fy;
    force2.x -= fx;
    force2.y -= fy;
  }

  // 3. Apply forces to update positions
  return nodes.map(node => {
    if (node.fx !== undefined && node.fy !== undefined) {
      return { ...node, x: node.fx, y: node.fy };
    }
    const force = forces.get(node.id)!;
    return {
      ...node,
      x: node.x + force.x * damping,
      y: node.y + force.y * damping
    };
  });
}

export function computeForceLayout(
  nodeIds: string[],
  edges: GraphEdgeLike[],
  initialPositions: Map<string, Point>,
  iterations = 80,
  repulsionConstant = 25000,
  attractionConstant = 0.04,
  damping = 0.85
): Map<string, Point> {
  let nodes: ForceLayoutNode[] = nodeIds.map(id => {
    const pos = initialPositions.get(id) || { x: Math.random() * 600, y: Math.random() * 500 };
    return { id, x: pos.x, y: pos.y };
  });

  for (let step = 0; step < iterations; step++) {
    const currentDamping = damping * (1 - step / iterations);
    nodes = computeForceLayoutStep(nodes, edges, repulsionConstant, attractionConstant, currentDamping);
  }

  const result = new Map<string, Point>();
  for (const node of nodes) {
    result.set(node.id, { x: node.x, y: node.y });
  }
  return result;
}

