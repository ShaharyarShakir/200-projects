import { Point } from "../../geometry";

export function computeCircularLayout(
  nodeIds: string[],
  center = { x: 400, y: 350 },
  radiusSpacing = 120
): Map<string, Point> {
  const placements = new Map<string, Point>();
  const n = nodeIds.length;
  if (n === 0) return placements;

  const radius = Math.max(160, (n * radiusSpacing) / (2 * Math.PI));

  nodeIds.forEach((id, idx) => {
    const angle = (idx * 2 * Math.PI) / n;
    placements.set(id, {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  });

  return placements;
}
