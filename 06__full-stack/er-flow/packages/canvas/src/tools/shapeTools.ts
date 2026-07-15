import { BaseTool, type ToolContext } from "./base";
import { type Point, type Shape, type ShapeType } from "../models";

function findEntityAtPoint(pt: Point, shapes: Shape[]): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.type === "er-entity") {
      if (
        pt.x >= s.x &&
        pt.x <= s.x + s.width &&
        pt.y >= s.y &&
        pt.y <= s.y + s.height
      ) {
        return s;
      }
    }
  }
  return null;
}

export class DrawShapeTool extends BaseTool {
  private activeShapeId: string | null = null;
  private startPoint: Point | null = null;

  constructor(public shapeType: ShapeType) {
    super(shapeType);
  }

  override onPointerDown(ctx: ToolContext): void {
    const { point, engine } = ctx;

    // Handle ER relationship drawing starter
    if (this.shapeType === "er-relationship") {
      const clickedEntity = findEntityAtPoint(point, engine.getShapes());
      if (!clickedEntity) {
        this.activeShapeId = null;
        this.startPoint = null;
        engine.setActiveTool("select");
        return;
      }
      this.startPoint = { ...point };
      this.activeShapeId = crypto.randomUUID();

      const newRel: any = {
        id: this.activeShapeId,
        type: "er-relationship",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        rotation: 0,
        fill: "transparent",
        stroke: "#818cf8",
        strokeWidth: 2,
        opacity: 1,
        sourceEntityId: clickedEntity.id,
        targetEntityId: "",
        sourceCardinality: "1",
        targetCardinality: "*",
        identifying: true,
        label: "",
        points: [{ ...point }, { ...point }],
      };

      engine.addShape(newRel);
      engine.selectShape(this.activeShapeId, false);
      return;
    }

    this.startPoint = { ...point };
    this.activeShapeId = crypto.randomUUID();

    // Default stylings
    let fill = "transparent";
    let stroke = "#6366f1"; // Indigo
    let text = "";
    let width = 0;
    let height = 0;
    let extraProps: any = {};

    if (this.shapeType === "sticky") {
      fill = "#fef08a"; // Yellow sticky
      stroke = "#eab308";
      text = "Sticky Note";
    } else if (this.shapeType === "text") {
      fill = "transparent";
      stroke = "transparent";
      text = "Text";
    } else if (this.shapeType === "circle") {
      stroke = "#10b981"; // Emerald
    } else if (this.shapeType === "diamond") {
      stroke = "#f97316"; // Orange
    } else if (this.shapeType === "er-entity") {
      fill = "#0f172a";
      stroke = "#1e293b";
      text = "NewEntity";
      width = 160;
      height = 140;
      extraProps = {
        attributes: [
          {
            id: crypto.randomUUID(),
            name: "id",
            type: "UUID",
            isPk: true,
            isFk: false,
            isNullable: false,
            isUnique: true,
          },
        ],
      };
    }

    const newShape: any = {
      id: this.activeShapeId,
      type: this.shapeType,
      x: point.x,
      y: point.y,
      width,
      height,
      rotation: 0,
      fill,
      stroke,
      strokeWidth: 2,
      opacity: 1,
      text,
      ...extraProps,
    };

    if (this.shapeType === "arrow" || this.shapeType === "line") {
      newShape.points = [
        { ...point },
        { ...point },
      ];
      newShape.stroke = "#3b82f6"; // Blue lines
    }

    engine.addShape(newShape as Shape);
    engine.selectShape(this.activeShapeId, false);
  }

  override onPointerMove(ctx: ToolContext): void {
    if (!this.startPoint || !this.activeShapeId) return;
    const { point, engine } = ctx;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const shape = engine.getShape(this.activeShapeId);
    if (!shape) return;

    if (shape.type === "arrow" || shape.type === "line" || shape.type === "er-relationship") {
      engine.updateShape(this.activeShapeId, {
        points: [
          { ...this.startPoint },
          { ...point },
        ],
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
    } else {
      const nextX = dx < 0 ? this.startPoint.x + dx : this.startPoint.x;
      const nextY = dy < 0 ? this.startPoint.y + dy : this.startPoint.y;

      engine.updateShape(this.activeShapeId, {
        x: nextX,
        y: nextY,
        width: Math.max(1, Math.abs(dx)),
        height: Math.max(1, Math.abs(dy)),
      });
    }
  }

  override onPointerUp(ctx: ToolContext): void {
    if (!this.activeShapeId || !this.startPoint) return;
    const { engine, point } = ctx;

    const shape = engine.getShape(this.activeShapeId);
    if (shape && shape.type === "er-relationship") {
      const targetEntity = findEntityAtPoint(point, engine.getShapes());
      if (targetEntity && targetEntity.id !== (shape as any).sourceEntityId) {
        engine.updateShape(this.activeShapeId, {
          targetEntityId: targetEntity.id,
        });
      } else {
        engine.deleteShape(this.activeShapeId);
      }
      this.activeShapeId = null;
      this.startPoint = null;
      engine.setActiveTool("select");
      return;
    }

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;
    const dragDistance = Math.sqrt(dx * dx + dy * dy);

    // If it's a simple click or tiny drag, expand to standard size
    if (dragDistance < 5) {
      if (this.shapeType === "text") {
        engine.updateShape(this.activeShapeId, {
          width: 120,
          height: 35,
        });
      } else if (this.shapeType === "sticky") {
        engine.updateShape(this.activeShapeId, {
          width: 140,
          height: 140,
        });
      } else if (this.shapeType === "arrow" || this.shapeType === "line") {
        engine.updateShape(this.activeShapeId, {
          points: [
            { ...this.startPoint },
            { x: this.startPoint.x + 120, y: this.startPoint.y },
          ],
          width: 120,
          height: 0,
        });
      } else if (this.shapeType === "er-entity") {
        // Keep initial default width and height
      } else {
        engine.updateShape(this.activeShapeId, {
          width: 120,
          height: 80,
        });
      }
    }

    this.activeShapeId = null;
    this.startPoint = null;
    // Auto switch to select tool after drawing
    engine.setActiveTool("select");
  }
}
