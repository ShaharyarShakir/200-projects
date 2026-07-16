export const LAYOUT_WORKER_CODE = `
self.onmessage = function(e) {
  const { nodes, edges, options } = e.data;
  const positions = {};
  const ids = nodes.map(n => n.id);

  if (options.mode === "circular") {
    const n = ids.length;
    const center = { x: 400, y: 350 };
    const radius = Math.max(160, (n * 120) / (2 * Math.PI));
    ids.forEach((id, idx) => {
      const angle = (idx * 2 * Math.PI) / n;
      positions[id] = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      };
    });
  } else if (options.mode === "grid" || options.mode === "orthogonal") {
    const cols = options.cols || Math.ceil(Math.sqrt(nodes.length));
    const colSpacing = 220;
    const rowSpacing = 180;
    ids.forEach((id, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      positions[id] = {
        x: col * colSpacing,
        y: row * rowSpacing
      };
    });
  } else if (options.mode === "tree") {
    const targets = new Set();
    for (const edge of edges) targets.add(edge.target);
    const roots = ids.filter(id => !targets.has(id));
    
    const hierarchy = {};
    for (const id of ids) hierarchy[id] = [];
    for (const edge of edges) {
      if (hierarchy[edge.source]) hierarchy[edge.source].push(edge.target);
    }

    const siblingSpacing = 150;
    const levelSpacing = 145;
    let currentXOffset = 0;

    function layoutSubtree(nodeId, depth) {
      const children = hierarchy[nodeId] || [];
      const y = depth * levelSpacing;

      if (children.length === 0) {
        positions[nodeId] = { x: currentXOffset, y };
        currentXOffset += siblingSpacing;
        return;
      }

      const startX = currentXOffset;
      for (const child of children) {
        layoutSubtree(child, depth + 1);
      }
      const endX = currentXOffset - siblingSpacing;
      positions[nodeId] = { x: (startX + endX) / 2, y };
    }

    for (const root of roots) {
      layoutSubtree(root, 0);
      currentXOffset += siblingSpacing;
    }

    const laidOut = new Set(Object.keys(positions));
    ids.filter(id => !laidOut.has(id)).forEach((id, idx) => {
      positions[id] = {
        x: idx * siblingSpacing,
        y: (roots.length > 0 ? 2.5 : 0) * levelSpacing
      };
    });
  } else if (options.mode === "layered") {
    const visited = new Set();
    const temp = new Set();
    const sorted = [];
    
    function visit(node) {
      if (temp.has(node)) return;
      if (visited.has(node)) return;
      temp.add(node);
      const outgoing = edges.filter(e => e.source === node).map(e => e.target);
      for (const o of outgoing) visit(o);
      temp.delete(node);
      visited.add(node);
      sorted.unshift(node);
    }
    
    for (const id of ids) {
      if (!visited.has(id)) visit(id);
    }

    const layers = [];
    const nodeToLayer = {};
    for (const node of sorted) {
      let maxParentLayer = -1;
      const parents = edges.filter(e => e.target === node).map(e => e.source);
      for (const p of parents) {
        if (nodeToLayer[p] !== undefined) {
          maxParentLayer = Math.max(maxParentLayer, nodeToLayer[p]);
        }
      }
      const layer = maxParentLayer + 1;
      nodeToLayer[node] = layer;
      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(node);
    }

    const layerSpacing = 150;
    const nodeSpacing = 120;
    layers.forEach((nodesInLayer, layerIdx) => {
      nodesInLayer.forEach((node, nodeIdx) => {
        const offset = ((nodesInLayer.length - 1) * nodeSpacing) / 2;
        positions[node] = {
          x: nodeIdx * nodeSpacing - offset,
          y: layerIdx * layerSpacing
        };
      });
    });

    for (const id of ids) {
      if (!positions[id]) positions[id] = { x: 0, y: 0 };
    }
  } else {
    let fnodes = nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
    const iterations = 80;
    const repulsionConstant = 25000;
    const attractionConstant = 0.04;
    const damping = 0.85;

    for (let step = 0; step < iterations; step++) {
      const curDamping = damping * (1 - step / iterations);
      const forces = {};
      for (const fn of fnodes) forces[fn.id] = { x: 0, y: 0 };

      for (let i = 0; i < fnodes.length; i++) {
        for (let j = i + 1; j < fnodes.length; j++) {
          const n1 = fnodes[i];
          const n2 = fnodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          const f = repulsionConstant / distSq;
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          
          forces[n1.id].x -= fx;
          forces[n1.id].y -= fy;
          forces[n2.id].x += fx;
          forces[n2.id].y += fy;
        }
      }

      for (const edge of edges) {
        const n1 = fnodes.find(n => n.id === edge.source);
        const n2 = fnodes.find(n => n.id === edge.target);
        if (!n1 || !n2) continue;
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = attractionConstant * dist;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        
        forces[n1.id].x += fx;
        forces[n1.id].y += fy;
        forces[n2.id].x -= fx;
        forces[n2.id].y -= fy;
      }

      fnodes = fnodes.map(fn => ({
        id: fn.id,
        x: fn.x + forces[fn.id].x * curDamping,
        y: fn.y + forces[fn.id].y * curDamping
      }));
    }

    for (const fn of fnodes) {
      positions[fn.id] = { x: fn.x, y: fn.y };
    }
  }

  self.postMessage(positions);
};
`;
