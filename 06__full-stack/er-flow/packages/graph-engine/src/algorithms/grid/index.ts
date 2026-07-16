import { Point } from "../../geometry";

export function computeGridLayout(
  nodeIds: string[],
  cols = 3,
  colSpacing = 220,
  rowSpacing = 180
): Map<string, Point> {
  const placements = new Map<string, Point>();
  nodeIds.forEach((id, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    placements.set(id, {
      x: col * colSpacing,
      y: row * rowSpacing
    });
  });
  return placements;
}
