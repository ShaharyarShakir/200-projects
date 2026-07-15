import { describe, it, expect } from "vitest";
import { screenToWorld, worldToScreen } from "../camera";
import { isPointInRect, isPointInCircle } from "../geometry";
import { DrawShapeTool, HandTool, SelectTool } from "../tools";

describe("Canvas Engine Geometry", () => {
  it("should test screen to world conversion", () => {
    const camera = { x: 10, y: 20, zoom: 2 };
    const rect = { left: 0, top: 0, width: 800, height: 600 } as DOMRect;

    const worldPt = screenToWorld(110, 220, camera, rect);
    expect(worldPt.x).toBe(50);
    expect(worldPt.y).toBe(100);

    const screenPt = worldToScreen(50, 100, camera, rect);
    expect(screenPt.x).toBe(110);
    expect(screenPt.y).toBe(220);
  });

  it("should test point in rect check", () => {
    const rect = { x: 10, y: 10, width: 100, height: 50, rotation: 0 };
    expect(isPointInRect({ x: 15, y: 15 }, rect)).toBe(true);
    expect(isPointInRect({ x: 5, y: 15 }, rect)).toBe(false);
  });

  it("should test point in circle check", () => {
    const circle = { x: 10, y: 10, width: 100, height: 100 };
    expect(isPointInCircle({ x: 60, y: 60 }, circle)).toBe(true);
    expect(isPointInCircle({ x: 0, y: 0 }, circle)).toBe(false);
  });

  it("should load tool classes without circular initialization errors", () => {
    expect(new HandTool()).toBeInstanceOf(HandTool);
    expect(new SelectTool()).toBeInstanceOf(SelectTool);
    expect(new DrawShapeTool("rectangle")).toBeInstanceOf(DrawShapeTool);
  });
});
