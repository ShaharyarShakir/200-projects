import { Point } from "../../geometry";
import { GraphEdgeLike } from "../../traversal";
import { topologicalSort } from "../dag";

export function computeLayeredLayout(
  nodeIds: string[],
  edges: GraphEdgeLike[],
  layerSpacing = 150,
  nodeSpacing = 120
): Map<string, Point> {
  // Simple layered layout: topological sort to establish layers
  const sorted = topologicalSort(nodeIds, edges);
  const layers: string[][] = [];
  
  // Greedy layer assignment
  const nodeToLayer = new Map<string, number>();
  for (const node of sorted) {
    let maxParentLayer = -1;
    const parents = edges.filter(e => e.target === node).map(e => e.source);
    
    for (const p of parents) {
      if (nodeToLayer.has(p)) {
        maxParentLayer = Math.max(maxParentLayer, nodeToLayer.get(p)!);
      }
    }
    
    const layer = maxParentLayer + 1;
    nodeToLayer.set(node, layer);
    
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push(node);
  }

  const positions = new Map<string, Point>();
  layers.forEach((nodesInLayer, layerIdx) => {
    nodesInLayer.forEach((node, nodeIdx) => {
      // Center the layer nodes horizontally
      const offset = ((nodesInLayer.length - 1) * nodeSpacing) / 2;
      positions.set(node, {
        x: nodeIdx * nodeSpacing - offset,
        y: layerIdx * layerSpacing
      });
    });
  });

  return positions;
}
