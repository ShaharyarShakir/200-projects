import { BaseTool, type ToolContext } from "./base";
import type { Point } from "../models";
import type { CanvasEngine } from "../core";

export class HandTool extends BaseTool {
  private startScreenPt: Point | null = null;
  private startCameraPos: { x: number; y: number } | null = null;

  constructor() {
    super("hand");
  }

  override onPointerDown(ctx: ToolContext): void {
    ctx.event.preventDefault();
    this.startScreenPt = { ...ctx.screenPoint };
    this.startCameraPos = { x: ctx.engine.camera.x, y: ctx.engine.camera.y };
    // Set cursor style
    ctx.engine.setCursor("grabbing");
  }

  override onPointerMove(ctx: ToolContext): void {
    if (!this.startScreenPt || !this.startCameraPos) return;

    const dx = ctx.screenPoint.x - this.startScreenPt.x;
    const dy = ctx.screenPoint.y - this.startScreenPt.y;

    ctx.engine.updateCamera({
      x: this.startCameraPos.x + dx,
      y: this.startCameraPos.y + dy,
    });
  }

  override onPointerUp(ctx: ToolContext): void {
    this.startScreenPt = null;
    this.startCameraPos = null;
    ctx.engine.setCursor("grab");
  }

  override onActivate(engine: CanvasEngine): void {
    engine.setCursor("grab");
  }

  override onDeactivate(engine: CanvasEngine): void {
    engine.setCursor("default");
  }
}
