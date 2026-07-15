import { BaseTool, type ToolContext } from "./base";
import { type Point, type Shape, type ShapeType } from "../models";

function findNodeAtPoint(pt: Point, shapes: Shape[], registry: any): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    const nodeDef = registry.getNodeDefinition(s.type);
    // Allow matching custom nodes or standard shapes with dimensions as nodes
    if (nodeDef || s.type === "er-entity" || ["rectangle", "circle", "diamond", "sticky"].includes(s.type)) {
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
    const registry = (engine as any).registry;

    // 1. Determine if this shapeType is an Edge
    const edgeDef = registry?.getEdgeDefinition(this.shapeType);
    const isEdge = !!edgeDef || this.shapeType === "er-relationship" || this.shapeType === "arrow" || this.shapeType === "line";

    if (isEdge) {
      const clickedNode = findNodeAtPoint(point, engine.getShapes(), registry);
      if (!clickedNode) {
        this.activeShapeId = null;
        this.startPoint = null;
        engine.setActiveTool("select");
        return;
      }
      this.startPoint = { ...point };
      this.activeShapeId = crypto.randomUUID();

      let newEdge: any = {
        id: this.activeShapeId,
        type: this.shapeType,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        rotation: 0,
        fill: "transparent",
        stroke: "#818cf8",
        strokeWidth: 2,
        opacity: 1,
        points: [{ ...point }, { ...point }],
      };

      if (edgeDef) {
        const customDefaults = edgeDef.createDefault(this.activeShapeId, clickedNode.id, "");
        newEdge = { ...newEdge, ...customDefaults };
      } else if (this.shapeType === "er-relationship") {
        newEdge.sourceEntityId = clickedNode.id;
        newEdge.targetEntityId = "";
        newEdge.sourceCardinality = "1";
        newEdge.targetCardinality = "*";
        newEdge.identifying = true;
        newEdge.label = "";
      } else {
        newEdge.source = clickedNode.id;
        newEdge.target = "";
        newEdge.stroke = "#3b82f6";
      }

      engine.addShape(newEdge);
      engine.selectShape(this.activeShapeId, false);
      return;
    }

    // 2. Otherwise it is a Node or Standard Shape
    this.startPoint = { ...point };
    this.activeShapeId = crypto.randomUUID();

    const nodeDef = registry?.getNodeDefinition(this.shapeType);
    let newShape: any = {
      id: this.activeShapeId,
      type: this.shapeType,
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      rotation: 0,
      fill: "transparent",
      stroke: "#6366f1",
      strokeWidth: 2,
      opacity: 1,
      text: "",
    };

    if (nodeDef) {
      const customDefaults = nodeDef.createDefault(this.activeShapeId, point.x, point.y);
      newShape = { ...newShape, ...customDefaults };
    } else {
      // Standard shape fallbacks
      if (this.shapeType === "sticky") {
        newShape.fill = "#fef08a";
        newShape.stroke = "#eab308";
        newShape.text = "Sticky Note";
      } else if (this.shapeType === "text") {
        newShape.fill = "transparent";
        newShape.stroke = "transparent";
        newShape.text = "Text";
      } else if (this.shapeType === "circle") {
        newShape.stroke = "#10b981";
      } else if (this.shapeType === "diamond") {
        newShape.stroke = "#f97316";
      } else if (this.shapeType === "er-entity") {
        newShape.fill = "#0f172a";
        newShape.stroke = "#1e293b";
        newShape.text = "NewEntity";
        newShape.width = 160;
        newShape.height = 140;
        newShape.attributes = [
          {
            id: crypto.randomUUID(),
            name: "id",
            type: "UUID",
            isPk: true,
            isFk: false,
            isNullable: false,
            isUnique: true,
          },
        ];
      }
    }

    engine.addShape(newShape as Shape);
    engine.selectShape(this.activeShapeId, false);
  }

  override onPointerMove(ctx: ToolContext): void {
    if (!this.startPoint || !this.activeShapeId) return;
    const { point, engine } = ctx;
    const registry = (engine as any).registry;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    const shape = engine.getShape(this.activeShapeId);
    if (!shape) return;

    const edgeDef = registry?.getEdgeDefinition(shape.type);
    const isEdge = !!edgeDef || shape.type === "er-relationship" || shape.type === "arrow" || shape.type === "line";

    if (isEdge) {
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
    const registry = (engine as any).registry;

    const shape = engine.getShape(this.activeShapeId);
    if (!shape) return;

    const edgeDef = registry?.getEdgeDefinition(shape.type);
    const isEdge = !!edgeDef || shape.type === "er-relationship" || shape.type === "arrow" || shape.type === "line";

    if (isEdge) {
      const targetNode = findNodeAtPoint(point, engine.getShapes(), registry);
      const sourceId = (shape as any).sourceEntityId || (shape as any).source;
      
      if (targetNode && targetNode.id !== sourceId) {
        if (shape.type === "er-relationship") {
          engine.updateShape(this.activeShapeId, {
            targetEntityId: targetNode.id,
          });
        } else {
          engine.updateShape(this.activeShapeId, {
            target: targetNode.id,
          });
        }
      } else {
        engine.deleteShape(this.activeShapeId);
      }
      this.activeShapeId = null;
      this.startPoint = null;
      engine.setActiveTool("select");
      return;
    }

    // Default sizing for nodes if single click
    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;
    const dragDistance = Math.sqrt(dx * dx + dy * dy);

    if (dragDistance < 5) {
      const nodeDef = registry?.getNodeDefinition(shape.type);
      if (nodeDef) {
        engine.updateShape(this.activeShapeId, {
          width: nodeDef.defaultWidth || 120,
          height: nodeDef.defaultHeight || 80,
        });
      } else {
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
        } else if (this.shapeType === "er-entity") {
          // Defaults are already set on down
        } else {
          engine.updateShape(this.activeShapeId, {
            width: 120,
            height: 80,
          });
        }
      }
    }

    this.activeShapeId = null;
    this.startPoint = null;
    engine.setActiveTool("select");
  }
}
