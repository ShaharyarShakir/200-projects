import type { Point } from "../models";

export interface Camera {
  x: number; // Horizontal pan offset
  y: number; // Vertical pan offset
  zoom: number; // Zoom scale factor (e.g. 1 = 100%)
}

export const DEFAULT_CAMERA: Camera = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5.0;

export function screenToWorld(clientX: number, clientY: number, camera: Camera, containerRect: DOMRect): Point {
  const screenX = clientX - containerRect.left;
  const screenY = clientY - containerRect.top;
  return {
    x: (screenX - camera.x) / camera.zoom,
    y: (screenY - camera.y) / camera.zoom,
  };
}

export function worldToScreen(worldX: number, worldY: number, camera: Camera, containerRect: DOMRect): Point {
  const screenX = worldX * camera.zoom + camera.x;
  const screenY = worldY * camera.zoom + camera.y;
  return {
    x: screenX + containerRect.left,
    y: screenY + containerRect.top,
  };
}

export function zoomToPoint(
  factor: number,
  clientX: number,
  clientY: number,
  camera: Camera,
  containerRect: DOMRect
): Camera {
  const mouseX = clientX - containerRect.left;
  const mouseY = clientY - containerRect.top;

  const nextZoom = Math.min(Math.max(camera.zoom * factor, MIN_ZOOM), MAX_ZOOM);

  // Keep the point under the mouse cursor at the same position
  const nextX = mouseX - ((mouseX - camera.x) / camera.zoom) * nextZoom;
  const nextY = mouseY - ((mouseY - camera.y) / camera.zoom) * nextZoom;

  return {
    x: nextX,
    y: nextY,
    zoom: nextZoom,
  };
}

export function fitToRect(
  bounds: { x: number; y: number; width: number; height: number },
  containerWidth: number,
  containerHeight: number,
  padding = 50
): Camera {
  if (bounds.width <= 0 || bounds.height <= 0) return DEFAULT_CAMERA;

  const wScale = (containerWidth - padding * 2) / bounds.width;
  const hScale = (containerHeight - padding * 2) / bounds.height;
  const nextZoom = Math.min(Math.max(Math.min(wScale, hScale), MIN_ZOOM), MAX_ZOOM);

  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  const nextX = containerWidth / 2 - cx * nextZoom;
  const nextY = containerHeight / 2 - cy * nextZoom;

  return {
    x: nextX,
    y: nextY,
    zoom: nextZoom,
  };
}
