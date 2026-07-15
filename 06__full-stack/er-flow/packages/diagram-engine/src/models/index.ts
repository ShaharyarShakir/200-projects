import { ErAttribute, CardinalityType } from "@eraser/er";

export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'arrow'
  | 'line'
  | 'diamond'
  | 'image'
  | 'sticky'
  | 'er-entity'
  | 'er-relationship';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number; // Left/start coordinate in world space
  y: number; // Top/start coordinate in world space
  width: number; // Width in world space
  height: number; // Height in world space
  rotation: number; // Angle in degrees
  fill: string; // Fill color (e.g. hex, tailwind, 'transparent')
  stroke: string; // Border color
  strokeWidth: number; // Border thickness
  opacity: number; // 0.0 to 1.0
  text?: string; // Text content if any
  metadata?: Record<string, any>;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
}

export interface CircleShape extends BaseShape {
  type: 'circle';
}

export interface TextShape extends BaseShape {
  type: 'text';
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  align?: 'left' | 'center' | 'right';
}

export interface Point {
  x: number;
  y: number;
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  points: Point[]; // [start, ...waypoints, end]
  arrowStartStyle?: 'none' | 'arrow';
  arrowEndStyle?: 'none' | 'arrow';
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: Point[]; // [start, ...waypoints, end]
}

export interface DiamondShape extends BaseShape {
  type: 'diamond';
}

export interface ImageShape extends BaseShape {
  type: 'image';
  src: string;
}

export interface StickyNoteShape extends BaseShape {
  type: 'sticky';
  colorTheme?: string; // e.g. yellow, blue, green, pink
}

export interface ErEntityShape extends BaseShape {
  type: 'er-entity';
  attributes: ErAttribute[];
  colorTheme?: string;
}

export interface ErRelationshipShape extends BaseShape {
  type: 'er-relationship';
  sourceEntityId: string;
  targetEntityId: string;
  sourceCardinality: CardinalityType;
  targetCardinality: CardinalityType;
  identifying: boolean;
  label?: string;
}

export type Shape =
  | RectangleShape
  | CircleShape
  | TextShape
  | ArrowShape
  | LineShape
  | DiamondShape
  | ImageShape
  | StickyNoteShape
  | ErEntityShape
  | ErRelationshipShape;
