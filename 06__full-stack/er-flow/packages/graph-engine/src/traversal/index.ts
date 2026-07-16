export interface GraphEdgeLike {
  source: string;
  target: string;
}

export function detectCycles(nodeIds: string[], edges: GraphEdgeLike[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const edge of edges) {
    if (adj.has(edge.source)) {
      adj.get(edge.source)!.push(edge.target);
    }
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]) {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          cycles.push(path.slice(cycleStartIndex));
        }
      }
    }

    recStack.delete(node);
  }

  for (const node of nodeIds) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

export function getConnectedComponents(nodeIds: string[], edges: GraphEdgeLike[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const edge of edges) {
    if (adj.has(edge.source)) adj.get(edge.source)!.push(edge.target);
    if (adj.has(edge.target)) adj.get(edge.target)!.push(edge.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  function dfs(node: string, comp: string[]) {
    visited.add(node);
    comp.push(node);
    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, comp);
      }
    }
  }

  for (const node of nodeIds) {
    if (!visited.has(node)) {
      const comp: string[] = [];
      dfs(node, comp);
      components.push(comp);
    }
  }

  return components;
}
