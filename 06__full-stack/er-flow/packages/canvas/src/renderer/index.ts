import { type Shape } from "../models";
import { type Camera } from "../camera";

export type GridMode = "dot" | "line" | "none";

export interface RendererProps {
  shapes: Shape[];
  camera: Camera;
  selectedIds: Set<string>;
  gridMode: GridMode;
  marquee: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  onDoubleClickShape?: (shapeId: string, e: React.MouseEvent) => void;
}
export * from "./svg";
