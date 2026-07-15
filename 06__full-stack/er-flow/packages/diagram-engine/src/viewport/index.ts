import type { Camera } from "../camera";

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function getViewportBounds(camera: Camera, width: number, height: number): ViewportBounds {
  return {
    minX: -camera.x / camera.zoom,
    minY: -camera.y / camera.zoom,
    maxX: (width - camera.x) / camera.zoom,
    maxY: (height - camera.y) / camera.zoom,
  };
}

export function isShapeInViewport(
  shape: { x: number; y: number; width: number; height: number },
  bounds: ViewportBounds,
  padding = 100
): boolean {
  const sx1 = Math.min(shape.x, shape.x + shape.width);
  const sx2 = Math.max(shape.x, shape.x + shape.width);
  const sy1 = Math.min(shape.y, shape.y + shape.height);
  const sy2 = Math.max(shape.y, shape.y + shape.height);

  return (
    sx2 >= bounds.minX - padding &&
    sx1 <= bounds.maxX + padding &&
    sy2 >= bounds.minY - padding &&
    sy1 <= bounds.maxY + padding
  );
}
