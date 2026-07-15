import type { Point } from "../models";
import type { CanvasEngine } from "../core";

export interface ToolContext {
  event: PointerEvent;
  point: Point; // Normalized world coordinates
  screenPoint: Point; // Screen coordinates relative to canvas element
  engine: CanvasEngine;
}

export interface Tool {
  id: string;
  onPointerDown(ctx: ToolContext): void;
  onPointerMove(ctx: ToolContext): void;
  onPointerUp(ctx: ToolContext): void;
  onKeyDown?(event: KeyboardEvent, engine: CanvasEngine): void;
  onKeyUp?(event: KeyboardEvent, engine: CanvasEngine): void;
  onActivate?(engine: CanvasEngine): void;
  onDeactivate?(engine: CanvasEngine): void;
}

export class BaseTool implements Tool {
  constructor(public id: string) {}

  onPointerDown(_ctx: ToolContext): void {}
  onPointerMove(_ctx: ToolContext): void {}
  onPointerUp(_ctx: ToolContext): void {}
  onKeyDown(_event: KeyboardEvent, _engine: CanvasEngine): void {}
  onKeyUp(_event: KeyboardEvent, _engine: CanvasEngine): void {}
  onActivate(_engine: CanvasEngine): void {}
  onDeactivate(_engine: CanvasEngine): void {}
}
