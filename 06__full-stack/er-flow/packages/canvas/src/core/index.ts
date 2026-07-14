import * as Y from "yjs";
import { type Camera, DEFAULT_CAMERA, screenToWorld } from "../camera";
import { type Shape } from "../models";
import { type Tool, type ToolContext, HandTool, SelectTool, DrawShapeTool } from "../tools";
import { HistoryManager } from "../history";
import { registerGlobalShortcuts } from "../events";

export class CanvasEngine {
  public camera: Camera = { ...DEFAULT_CAMERA };
  public selectedIds: Set<string> = new Set();
  public activeTool: Tool | null = null;
  public gridMode: "dot" | "line" | "none" = "dot";
  public marquee: { start: { x: number; y: number }; end: { x: number; y: number } } | null = null;
  public cursor: string = "default";
  
  private shapesMap: Y.Map<any>;
  public history: HistoryManager;
  private containerRect: DOMRect | null = null;
  
  // Available tools map
  private tools: Map<string, Tool> = new Map();
  
  // Event listeners for state changes
  private listeners: Set<() => void> = new Set();
  private cursorListeners: Set<(cursor: string) => void> = new Set();
  private cleanupShortcuts: (() => void) | null = null;

  constructor(public ydoc: Y.Doc) {
    this.shapesMap = ydoc.getMap("shapes");
    this.history = new HistoryManager(this.shapesMap);

    // Initialize tools
    this.tools.set("select", new SelectTool());
    this.tools.set("hand", new HandTool());
    this.tools.set("rectangle", new DrawShapeTool("rectangle"));
    this.tools.set("circle", new DrawShapeTool("circle"));
    this.tools.set("diamond", new DrawShapeTool("diamond"));
    this.tools.set("arrow", new DrawShapeTool("arrow"));
    this.tools.set("line", new DrawShapeTool("line"));
    this.tools.set("text", new DrawShapeTool("text"));
    this.tools.set("sticky", new DrawShapeTool("sticky"));
    this.tools.set("er-entity", new DrawShapeTool("er-entity"));
    this.tools.set("er-relationship", new DrawShapeTool("er-relationship"));

    // Set default active tool
    this.setActiveTool("select");

    // Observe Yjs document updates to notify React listeners
    this.shapesMap.observeDeep(() => {
      this.notify();
    });

    // Register global key shortcuts
    this.cleanupShortcuts = registerGlobalShortcuts(this);
  }

  public destroy(): void {
    if (this.cleanupShortcuts) {
      this.cleanupShortcuts();
    }
    this.listeners.clear();
    this.cursorListeners.clear();
  }

  // Subscribe to render tick changes
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeCursor(listener: (cursor: string) => void): () => void {
    this.cursorListeners.add(listener);
    return () => {
      this.cursorListeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Cursor handling
  public setCursor(cursor: string): void {
    this.cursor = cursor;
    for (const listener of this.cursorListeners) {
      listener(cursor);
    }
  }

  // Tool manager
  public setActiveTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (!tool) return;

    if (this.activeTool && this.activeTool.onDeactivate) {
      this.activeTool.onDeactivate(this);
    }

    this.activeTool = tool;
    this.notify();

    if (tool.onActivate) {
      tool.onActivate(this);
    }
  }

  // Shapes Map accessors
  public getShapes(): Shape[] {
    const shapes: Shape[] = [];
    this.shapesMap.forEach((val) => {
      if (val instanceof Y.Map) {
        shapes.push(val.toJSON() as Shape);
      } else {
        shapes.push(val as Shape);
      }
    });
    return shapes;
  }

  public getShape(id: string): Shape | null {
    const val = this.shapesMap.get(id);
    if (!val) return null;
    return val instanceof Y.Map ? (val.toJSON() as Shape) : (val as Shape);
  }

  public syncRelationshipPoints(): void {
    const shapes = this.getShapes();
    const relationships = shapes.filter(s => s.type === "er-relationship");
    
    for (const rel of relationships) {
      const source = shapes.find(s => s.id === (rel as any).sourceEntityId);
      const target = shapes.find(s => s.id === (rel as any).targetEntityId);
      if (!source || !target) continue;
      
      const pts = calculateConnectorPoints(source, target);
      const currentPts = (rel as any).points || [];
      
      if (
        currentPts.length !== pts.length ||
        currentPts[0]?.x !== pts[0]?.x ||
        currentPts[0]?.y !== pts[0]?.y ||
        currentPts[1]?.x !== pts[1]?.x ||
        currentPts[1]?.y !== pts[1]?.y
      ) {
        const nestedMap = this.shapesMap.get(rel.id);
        if (nestedMap instanceof Y.Map) {
          nestedMap.set("points", pts);
        }
      }
    }
  }

  public addShape(shape: Shape): void {
    this.ydoc.transact(() => {
      const nestedMap = new Y.Map();
      for (const [k, v] of Object.entries(shape)) {
        nestedMap.set(k, v);
      }
      this.shapesMap.set(shape.id, nestedMap);
      this.syncRelationshipPoints();
    });
  }

  public updateShape(id: string, props: Partial<Shape>): void {
    const nestedMap = this.shapesMap.get(id);
    if (nestedMap instanceof Y.Map) {
      this.ydoc.transact(() => {
        for (const [k, v] of Object.entries(props)) {
          nestedMap.set(k, v);
        }
        this.syncRelationshipPoints();
      });
    }
  }

  public deleteShape(id: string): void {
    this.ydoc.transact(() => {
      this.shapesMap.delete(id);
      this.syncRelationshipPoints();
    });
    this.selectedIds.delete(id);
    this.notify();
  }

  public deleteSelectedShapes(): void {
    if (this.selectedIds.size === 0) return;
    this.ydoc.transact(() => {
      for (const id of this.selectedIds) {
        this.shapesMap.delete(id);
      }
    });
    this.selectedIds.clear();
    this.notify();
  }

  // Transactions
  public transact(fn: () => void): void {
    this.ydoc.transact(fn);
  }

  // Selection manager
  public selectShape(id: string, addToSelection = false): void {
    if (!addToSelection) {
      this.selectedIds.clear();
    }
    this.selectedIds.add(id);
    this.notify();
  }

  public selectShapes(ids: string[]): void {
    this.selectedIds.clear();
    for (const id of ids) {
      this.selectedIds.add(id);
    }
    this.notify();
  }

  public deselectShape(id: string): void {
    this.selectedIds.delete(id);
    this.notify();
  }

  public clearSelection(): void {
    if (this.selectedIds.size === 0) return;
    this.selectedIds.clear();
    this.notify();
  }

  public getSelectedShapes(): Shape[] {
    const selected: Shape[] = [];
    for (const id of this.selectedIds) {
      const s = this.getShape(id);
      if (s) selected.push(s);
    }
    return selected;
  }

  // Camera settings
  public updateCamera(props: Partial<Camera>): void {
    this.camera = { ...this.camera, ...props };
    this.notify();
  }

  public setGridMode(mode: "dot" | "line" | "none"): void {
    this.gridMode = mode;
    this.notify();
  }

  public setMarquee(marquee: { start: { x: number; y: number }; end: { x: number; y: number } } | null): void {
    this.marquee = marquee;
    this.notify();
  }

  // Viewport DOMRect tracking
  public setContainerRect(rect: DOMRect | null): void {
    this.containerRect = rect;
  }

  public getContainerRect(): DOMRect | null {
    return this.containerRect;
  }

  // Undo / Redo wraps
  public undo(): void {
    this.history.undo();
  }

  public redo(): void {
    this.history.redo();
  }

  // Pointer event entry-points (Forwarded from SvgRenderer React triggers)
  public handlePointerDown(e: React.PointerEvent<SVGSVGElement>, containerElement: SVGSVGElement): void {
    const rect = containerElement.getBoundingClientRect();
    this.setContainerRect(rect);
    containerElement.setPointerCapture(e.pointerId);

    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPt = screenToWorld(e.clientX, e.clientY, this.camera, rect);

    const ctx: ToolContext = {
      event: e.nativeEvent,
      point: worldPt,
      screenPoint: screenPt,
      engine: this,
    };

    if (this.activeTool) {
      this.activeTool.onPointerDown(ctx);
    }
  }

  public handlePointerMove(e: React.PointerEvent<SVGSVGElement>, containerElement: SVGSVGElement): void {
    const rect = this.getContainerRect() || containerElement.getBoundingClientRect();
    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPt = screenToWorld(e.clientX, e.clientY, this.camera, rect);

    const ctx: ToolContext = {
      event: e.nativeEvent,
      point: worldPt,
      screenPoint: screenPt,
      engine: this,
    };

    if (this.activeTool) {
      this.activeTool.onPointerMove(ctx);
    }
  }

  public handlePointerUp(e: React.PointerEvent<SVGSVGElement>, containerElement: SVGSVGElement): void {
    const rect = this.getContainerRect() || containerElement.getBoundingClientRect();
    containerElement.releasePointerCapture(e.pointerId);

    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPt = screenToWorld(e.clientX, e.clientY, this.camera, rect);

    const ctx: ToolContext = {
      event: e.nativeEvent,
      point: worldPt,
      screenPoint: screenPt,
      engine: this,
    };

    if (this.activeTool) {
      this.activeTool.onPointerUp(ctx);
    }
  }
}

function calculateConnectorPoints(source: any, target: any): { x: number; y: number }[] {
  const sc = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const tc = { x: target.x + target.width / 2, y: target.y + target.height / 2 };

  const dx = Math.abs(sc.x - tc.x);
  const dy = Math.abs(sc.y - tc.y);

  if (dx > dy) {
    if (sc.x < tc.x) {
      return [
        { x: source.x + source.width, y: sc.y },
        { x: target.x, y: tc.y },
      ];
    } else {
      return [
        { x: source.x, y: sc.y },
        { x: target.x + target.width, y: tc.y },
      ];
    }
  } else {
    if (sc.y < tc.y) {
      return [
        { x: sc.x, y: source.y + source.height },
        { x: tc.x, y: target.y },
      ];
    } else {
      return [
        { x: sc.x, y: source.y },
        { x: tc.x, y: target.y + target.height },
      ];
    }
  }
}
