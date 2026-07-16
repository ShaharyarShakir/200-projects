import { GraphEdgeLike, detectCycles, getConnectedComponents } from "../traversal";

export interface GraphDiagnostic {
  id: string;
  severity: "error" | "warning";
  message: string;
  targetId: string;
}

export function validateGraphStructure(
  nodeIds: string[],
  edges: GraphEdgeLike[]
): GraphDiagnostic[] {
  const diagnostics: GraphDiagnostic[] = [];

  // 1. Cycle detection in directed connections
  const cycles = detectCycles(nodeIds, edges);
  for (const cycle of cycles) {
    diagnostics.push({
      id: `cycle-${cycle.join("-")}`,
      severity: "warning",
      message: `Cycle detected in path: ${cycle.join(" -> ")}`,
      targetId: cycle[0],
    });
  }

  // 2. Disconnected components detection
  if (nodeIds.length > 1) {
    const components = getConnectedComponents(nodeIds, edges);
    if (components.length > 1) {
      diagnostics.push({
        id: "disconnected-graph",
        severity: "warning",
        message: `Graph is split into ${components.length} isolated clusters.`,
        targetId: nodeIds[0],
      });
    }
  }

  return diagnostics;
}
