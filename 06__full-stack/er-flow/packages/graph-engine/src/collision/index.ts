import { Point } from "../geometry";

export interface CollisionRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectsOverlap(r1: CollisionRect, r2: CollisionRect): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

export function resolveCollisions(
  rects: CollisionRect[],
  padding = 30,
  maxIterations = 8
): Map<string, Point> {
  const activeRects = rects.map((r) => ({ ...r }));

  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    for (let i = 0; i < activeRects.length; i++) {
      for (let j = i + 1; j < activeRects.length; j++) {
        const r1 = activeRects[i];
        const r2 = activeRects[j];

        if (rectsOverlap(r1, r2)) {
          moved = true;
          const c1 = { x: r1.x + r1.width / 2, y: r1.y + r1.height / 2 };
          const c2 = { x: r2.x + r2.width / 2, y: r2.y + r2.height / 2 };

          let dx = c2.x - c1.x;
          let dy = c2.y - c1.y;

          if (dx === 0 && dy === 0) {
            dx = Math.random() - 0.5 || 1;
            dy = Math.random() - 0.5 || 1;
          }

          const targetW = (r1.width + r2.width) / 2 + padding;
          const targetH = (r1.height + r2.height) / 2 + padding;
          const overlapX = targetW - Math.abs(dx);
          const overlapY = targetH - Math.abs(dy);

          if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
              const pushX = (overlapX / 2) * Math.sign(dx);
              r1.x -= pushX;
              r2.x += pushX;
            } else {
              const pushY = (overlapY / 2) * Math.sign(dy);
              r1.y -= pushY;
              r2.y += pushY;
            }
          }
        }
      }
    }
    if (!moved) break;
  }

  const positions = new Map<string, Point>();
  for (const r of activeRects) {
    positions.set(r.id, { x: r.x, y: r.y });
  }
  return positions;
}
