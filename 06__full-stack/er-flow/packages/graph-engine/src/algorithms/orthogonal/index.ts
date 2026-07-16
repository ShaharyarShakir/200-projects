import { Point } from "../../geometry";

export function computeOrthogonalGridPlacement(
  nodeIds: string[],
  cols = 3,
  horizontalSpacing = 200,
  verticalSpacing = 150
): Map<string, Point> {
  const placements = new Map<string, Point>();
  nodeIds.forEach((id, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    placements.set(id, {
      x: col * horizontalSpacing,
      y: row * verticalSpacing
    });
  });
  return placements;
}
