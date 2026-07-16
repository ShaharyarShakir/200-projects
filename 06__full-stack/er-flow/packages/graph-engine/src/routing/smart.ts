import { Point } from "../geometry";

export interface ObstacleBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function lineIntersectsBox(p1: Point, p2: Point, box: ObstacleBox, margin = 2): boolean {
  const bxMin = box.x - margin;
  const bxMax = box.x + box.width + margin;
  const byMin = box.y - margin;
  const byMax = box.y + box.height + margin;

  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  // If segment is outside box bounds entirely
  if (maxX < bxMin || minX > bxMax || maxY < byMin || minY > byMax) {
    return false;
  }

  // Horizontal segment intersect check
  if (p1.y === p2.y) {
    return p1.y >= byMin && p1.y <= byMax;
  }

  // Vertical segment intersect check
  if (p1.x === p2.x) {
    return p1.x >= bxMin && p1.x <= bxMax;
  }

  return true;
}

export function calculateSmartOrthogonalRoute(
  source: Point,
  target: Point,
  obstacles: ObstacleBox[],
  margin = 25
): Point[] {
  // 1. Gather all candidate X and Y coordinates to build a navigation graph
  const xCoordsSet = new Set<number>([source.x, target.x]);
  const yCoordsSet = new Set<number>([source.y, target.y]);

  for (const box of obstacles) {
    xCoordsSet.add(box.x - margin);
    xCoordsSet.add(box.x + box.width + margin);
    yCoordsSet.add(box.y - margin);
    yCoordsSet.add(box.y + box.height + margin);
  }

  const xCoords = Array.from(xCoordsSet).sort((a, b) => a - b);
  const yCoords = Array.from(yCoordsSet).sort((a, b) => a - b);

  // 2. Perform A* search on the grid
  interface QueueNode {
    point: Point;
    path: Point[];
    gScore: number;
    fScore: number;
  }

  const startPt = source;
  const endPt = target;

  const openList: QueueNode[] = [
    {
      point: startPt,
      path: [startPt],
      gScore: 0,
      fScore: Math.abs(endPt.x - startPt.x) + Math.abs(endPt.y - startPt.y),
    },
  ];

  const closedSet = new Set<string>();
  const pointKey = (p: Point) => `${Math.round(p.x)},${Math.round(p.y)}`;

  let bestFallbackPath: Point[] = [];
  let minFallbackDist = Infinity;

  while (openList.length > 0) {
    // Sort openList to get node with lowest fScore
    openList.sort((a, b) => a.fScore - b.fScore);
    const current = openList.shift()!;
    const currKey = pointKey(current.point);

    if (closedSet.has(currKey)) continue;
    closedSet.add(currKey);

    // If we reached the target, return the route path
    const distToEnd = Math.abs(current.point.x - endPt.x) + Math.abs(current.point.y - endPt.y);
    if (distToEnd < 2) {
      // Append end point if not already last
      if (pointKey(current.path[current.path.length - 1]) !== pointKey(endPt)) {
        current.path.push(endPt);
      }
      return current.path;
    }

    if (distToEnd < minFallbackDist) {
      minFallbackDist = distToEnd;
      bestFallbackPath = [...current.path, endPt];
    }

    // Find grid index indices
    const currentXIdx = xCoords.findIndex((x) => Math.abs(x - current.point.x) < 2);
    const currentYIdx = yCoords.findIndex((y) => Math.abs(y - current.point.y) < 2);

    // Compute neighbors (left, right, up, down grid crossings)
    const neighbors: Point[] = [];
    if (currentXIdx > 0) neighbors.push({ x: xCoords[currentXIdx - 1], y: current.point.y });
    if (currentXIdx < xCoords.length - 1 && currentXIdx !== -1)
      neighbors.push({ x: xCoords[currentXIdx + 1], y: current.point.y });
    if (currentYIdx > 0) neighbors.push({ x: current.point.x, y: yCoords[currentYIdx - 1] });
    if (currentYIdx < yCoords.length - 1 && currentYIdx !== -1)
      neighbors.push({ x: current.point.x, y: yCoords[currentYIdx + 1] });

    // Also add the end target direct neighbors if close
    if (Math.abs(current.point.x - endPt.x) < 50 || Math.abs(current.point.y - endPt.y) < 50) {
      neighbors.push(endPt);
    }

    for (const next of neighbors) {
      const nextKey = pointKey(next);
      if (closedSet.has(nextKey)) continue;

      // Ensure segment does not intersect any intermediate obstacle interior
      let intersectsObstacle = false;
      for (const box of obstacles) {
        if (lineIntersectsBox(current.point, next, box, 4)) {
          intersectsObstacle = true;
          break;
        }
      }
      if (intersectsObstacle) continue;

      const stepDist = Math.abs(next.x - current.point.x) + Math.abs(next.y - current.point.y);
      const nextG = current.gScore + stepDist;
      const nextH = Math.abs(endPt.x - next.x) + Math.abs(endPt.y - next.y);

      openList.push({
        point: next,
        path: [...current.path, next],
        gScore: nextG,
        fScore: nextG + nextH,
      });
    }
  }

  // Fallback to direct simple routing if no obstacle-free path can be calculated
  if (bestFallbackPath.length > 0) {
    return bestFallbackPath;
  }
  return [source, { x: (source.x + target.x) / 2, y: source.y }, { x: (source.x + target.x) / 2, y: target.y }, target];
}
