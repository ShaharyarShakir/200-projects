import { Point } from "../geometry";

export interface SnapGuide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function snapToGrid(value: number, spacing = 40): number {
  return Math.round(value / spacing) * spacing;
}

export function calculateSnapping(
  draggingId: string,
  draggingBox: { x: number; y: number; width: number; height: number },
  otherNodes: { id: string; x: number; y: number; width: number; height: number }[],
  threshold = 8
): {
  snappedX: number;
  snappedY: number;
  guides: SnapGuide[];
} {
  let snappedX = draggingBox.x;
  let snappedY = draggingBox.y;
  const guides: SnapGuide[] = [];

  const dragLeft = draggingBox.x;
  const dragCenterX = draggingBox.x + draggingBox.width / 2;
  const dragRight = draggingBox.x + draggingBox.width;

  const dragTop = draggingBox.y;
  const dragCenterY = draggingBox.y + draggingBox.height / 2;
  const dragBottom = draggingBox.y + draggingBox.height;

  let minDiffX = threshold;
  let minDiffY = threshold;

  // 1. Vertical alignments (determines snapped X and draws vertical lines)
  for (const node of otherNodes) {
    if (node.id === draggingId) continue;

    const nodeLeft = node.x;
    const nodeCenterX = node.x + node.width / 2;
    const nodeRight = node.x + node.width;

    const matchesX = [
      { dragVal: dragLeft, targetVal: nodeLeft, resultX: nodeLeft },
      { dragVal: dragLeft, targetVal: nodeCenterX, resultX: nodeCenterX },
      { dragVal: dragLeft, targetVal: nodeRight, resultX: nodeRight },
      { dragVal: dragCenterX, targetVal: nodeLeft, resultX: nodeLeft - draggingBox.width / 2 },
      { dragVal: dragCenterX, targetVal: nodeCenterX, resultX: nodeCenterX - draggingBox.width / 2 },
      { dragVal: dragCenterX, targetVal: nodeRight, resultX: nodeRight - draggingBox.width / 2 },
      { dragVal: dragRight, targetVal: nodeLeft, resultX: nodeLeft - draggingBox.width },
      { dragVal: dragRight, targetVal: nodeCenterX, resultX: nodeCenterX - draggingBox.width },
      { dragVal: dragRight, targetVal: nodeRight, resultX: nodeRight - draggingBox.width },
    ];

    for (const match of matchesX) {
      const diff = Math.abs(match.dragVal - match.targetVal);
      if (diff < minDiffX) {
        minDiffX = diff;
        snappedX = match.resultX;

        const yMin = Math.min(draggingBox.y, node.y);
        const yMax = Math.max(draggingBox.y + draggingBox.height, node.y + node.height);
        guides.push({
          x1: match.targetVal,
          y1: yMin - 40,
          x2: match.targetVal,
          y2: yMax + 40,
        });
      }
    }
  }

  // 2. Horizontal alignments (determines snapped Y and draws horizontal lines)
  for (const node of otherNodes) {
    if (node.id === draggingId) continue;

    const nodeTop = node.y;
    const nodeCenterY = node.y + node.height / 2;
    const nodeBottom = node.y + node.height;

    const matchesY = [
      { dragVal: dragTop, targetVal: nodeTop, resultY: nodeTop },
      { dragVal: dragTop, targetVal: nodeCenterY, resultY: nodeCenterY },
      { dragVal: dragTop, targetVal: nodeBottom, resultY: nodeBottom },
      { dragVal: dragCenterY, targetVal: nodeTop, resultY: nodeTop - draggingBox.height / 2 },
      { dragVal: dragCenterY, targetVal: nodeCenterY, resultY: nodeCenterY - draggingBox.height / 2 },
      { dragVal: dragCenterY, targetVal: nodeBottom, resultY: nodeBottom - draggingBox.height / 2 },
      { dragVal: dragBottom, targetVal: nodeTop, resultY: nodeTop - draggingBox.height },
      { dragVal: dragBottom, targetVal: nodeCenterY, resultY: nodeCenterY - draggingBox.height },
      { dragVal: dragBottom, targetVal: nodeBottom, resultY: nodeBottom - draggingBox.height },
    ];

    for (const match of matchesY) {
      const diff = Math.abs(match.dragVal - match.targetVal);
      if (diff < minDiffY) {
        minDiffY = diff;
        snappedY = match.resultY;

        const xMin = Math.min(draggingBox.x, node.x);
        const xMax = Math.max(draggingBox.x + draggingBox.width, node.x + node.width);
        guides.push({
          x1: xMin - 40,
          y1: match.targetVal,
          x2: xMax + 40,
          y2: match.targetVal,
        });
      }
    }
  }

  return { snappedX, snappedY, guides };
}
