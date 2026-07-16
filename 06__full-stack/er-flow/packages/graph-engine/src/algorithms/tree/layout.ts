import { Point } from "../../geometry";
import { GraphEdgeLike } from "../../traversal";
import { findTreeRoots, getTreeHierarchy } from "./index";

export function computeTreeLayout(
  nodeIds: string[],
  edges: GraphEdgeLike[],
  options?: { siblingSpacing?: number; levelSpacing?: number }
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const roots = findTreeRoots(nodeIds, edges);
  const hierarchy = getTreeHierarchy(nodeIds, edges);

  const siblingSpacing = options?.siblingSpacing ?? 150;
  const levelSpacing = options?.levelSpacing ?? 140;

  let currentXOffset = 0;

  function layoutSubtree(nodeId: string, depth: number): void {
    const children = hierarchy.get(nodeId) || [];
    const y = depth * levelSpacing;

    if (children.length === 0) {
      positions.set(nodeId, { x: currentXOffset, y });
      currentXOffset += siblingSpacing;
      return;
    }

    const startX = currentXOffset;
    for (const child of children) {
      layoutSubtree(child, depth + 1);
    }
    const endX = currentXOffset - siblingSpacing;

    const parentX = (startX + endX) / 2;
    positions.set(nodeId, { x: parentX, y });
  }

  // Layout each independent tree root
  for (const root of roots) {
    layoutSubtree(root, 0);
    // Add extra padding between root systems
    currentXOffset += siblingSpacing;
  }

  // Handle disconnected elements not captured by root structures
  const laidOut = new Set(positions.keys());
  const disconnected = nodeIds.filter(id => !laidOut.has(id));
  disconnected.forEach((id, idx) => {
    positions.set(id, {
      x: idx * siblingSpacing,
      y: (roots.length > 0 ? 2.5 : 0) * levelSpacing
    });
  });

  return positions;
}
