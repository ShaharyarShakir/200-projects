import * as Y from "yjs";
import { type Camera, DEFAULT_CAMERA, screenToWorld } from "../camera";
import { type Shape } from "../models";
import { type Tool, type ToolContext, HandTool, SelectTool, DrawShapeTool } from "../tools";
import { HistoryManager } from "../history";
import { registerGlobalShortcuts } from "../events";
import { DiagramRegistry } from "../registry";
import { DiagramPlugin } from "../types/plugin";
import {
  calculateConnectorPoints,
  calculateOrthogonalRoute,
  calculateBezierRoute,
  calculateStraightRoute,
  LAYOUT_WORKER_CODE,
  alignSelectedNodes,
  distributeSelectedNodes,
  LayoutMode
} from "@eraser/graph-engine";

export class CanvasEngine {
  public camera: Camera = { ...DEFAULT_CAMERA };
  public selectedIds: Set<string> = new Set();
  public activeTool: Tool | null = null;
  public gridMode: "dot" | "line" | "none" = "dot";
  public marquee: { start: { x: number; y: number }; end: { x: number; y: number } } | null = null;
  public cursor: string = "default";
  public activeGuides: { x1: number; y1: number; x2: number; y2: number }[] = [];
  public isLayoutAnimating = false;
  
  public registry: DiagramRegistry = new DiagramRegistry();
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

    // Initialize core standard tools
    this.tools.set("select", new SelectTool());
    this.tools.set("hand", new HandTool());
    this.tools.set("rectangle", new DrawShapeTool("rectangle"));
    this.tools.set("circle", new DrawShapeTool("circle"));
    this.tools.set("diamond", new DrawShapeTool("diamond"));
    this.tools.set("arrow", new DrawShapeTool("arrow"));
    this.tools.set("line", new DrawShapeTool("line"));
    this.tools.set("text", new DrawShapeTool("text"));
    this.tools.set("sticky", new DrawShapeTool("sticky"));

    // Set default active tool
    this.setActiveTool("select");

    // Observe Yjs document updates to notify React listeners
    this.shapesMap.observeDeep(() => {
      this.notify();
    });

    // Register global key shortcuts
    this.cleanupShortcuts = registerGlobalShortcuts(this);
  }

  public registerPlugin(plugin: DiagramPlugin): void {
    this.registry.registerPlugin(plugin);

    // Automatically create DrawShapeTools for plugin's custom node types
    for (const nodeDef of plugin.nodeTypes) {
      if (!this.tools.has(nodeDef.type)) {
        this.tools.set(nodeDef.type, new DrawShapeTool(nodeDef.type as any));
      }
    }

    // Automatically create DrawShapeTools for plugin's custom edge types
    if (plugin.edgeTypes) {
      for (const edgeDef of plugin.edgeTypes) {
        if (!this.tools.has(edgeDef.type)) {
          this.tools.set(edgeDef.type, new DrawShapeTool(edgeDef.type as any));
        }
      }
    }

    this.notify();
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
    const otherNodes = shapes.filter(
      (s) => !this.registry.getEdgeDefinition(s.type) && s.type !== "er-relationship"
    );

    for (const shape of shapes) {
      const edgeDef = this.registry.getEdgeDefinition(shape.type);
      if (edgeDef) {
        const sourceId = (shape as any).sourceEntityId || (shape as any).source;
        const targetId = (shape as any).targetEntityId || (shape as any).target;
        if (!sourceId || !targetId) continue;

        const source = shapes.find((s) => s.id === sourceId);
        const target = shapes.find((s) => s.id === targetId);
        if (!source || !target) continue;

        const ports = calculateConnectorPoints(source, target);
        if (ports.length < 2) continue;
        const startPort = ports[0];
        const endPort = ports[1];

        const routingType = (shape as any).routingType || "orthogonal";
        let pts: Point[] = [startPort, endPort];

        if (routingType === "orthogonal") {
          const obstacles = otherNodes
            .filter((s) => s.id !== sourceId && s.id !== targetId)
            .map((s) => ({
              id: s.id,
              x: s.x,
              y: s.y,
              width: s.width,
              height: s.height,
            }));
          pts = calculateOrthogonalRoute(startPort, endPort, undefined, undefined, obstacles);
        } else if (routingType === "bezier" || routingType === "curved") {
          pts = calculateBezierRoute(startPort, endPort);
        } else {
          pts = calculateStraightRoute(startPort, endPort);
        }

        const currentPts = (shape as any).points || [];
        const isDifferent =
          currentPts.length !== pts.length ||
          currentPts.some((p: any, idx: number) => p.x !== pts[idx]?.x || p.y !== pts[idx]?.y);

        if (isDifferent) {
          const nestedMap = this.shapesMap.get(shape.id);
          if (nestedMap instanceof Y.Map) {
            nestedMap.set("points", pts);
          }
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

  public triggerAutoLayout(mode: LayoutMode): Promise<void> {
    const shapes = this.getShapes();
    const nodes = shapes
      .filter((s) => !this.registry.getEdgeDefinition(s.type) && s.type !== "er-relationship")
      .map((s) => ({ id: s.id, x: s.x, y: s.y, width: s.width, height: s.height }));

    const edges = shapes
      .filter((s) => !!this.registry.getEdgeDefinition(s.type) || s.type === "er-relationship")
      .map((s) => ({
        source: (s as any).sourceEntityId || (s as any).source,
        target: (s as any).targetEntityId || (s as any).target,
      }));

    return new Promise((resolve) => {
      this.isLayoutAnimating = true;
      this.notify();

      const blob = new Blob([LAYOUT_WORKER_CODE], { type: "application/javascript" });
      const worker = new Worker(URL.createObjectURL(blob));

      worker.postMessage({ nodes, edges, options: { mode } });
      worker.onmessage = (e) => {
        const newPositions = e.data;
        this.transact(() => {
          for (const [id, pos] of Object.entries(newPositions)) {
            this.updateShape(id, pos as any);
          }
        });

        worker.terminate();

        setTimeout(() => {
          this.isLayoutAnimating = false;
          this.notify();
          resolve();
        }, 500);
      };
    });
  }

  public alignSelected(type: "left" | "right" | "center" | "top" | "bottom" | "middle"): void {
    const selected = this.getSelectedShapes().filter(
      (s) => !this.registry.getEdgeDefinition(s.type) && s.type !== "er-relationship"
    );
    if (selected.length <= 1) return;

    this.isLayoutAnimating = true;
    this.notify();

    const rects = selected.map((s) => ({ id: s.id, x: s.x, y: s.y, width: s.width, height: s.height }));
    const result = alignSelectedNodes(rects, type);

    this.transact(() => {
      for (const [id, pos] of result.entries()) {
        this.updateShape(id, pos);
      }
    });

    setTimeout(() => {
      this.isLayoutAnimating = false;
      this.notify();
    }, 500);
  }

  public distributeSelected(direction: "horizontal" | "vertical"): void {
    const selected = this.getSelectedShapes().filter(
      (s) => !this.registry.getEdgeDefinition(s.type) && s.type !== "er-relationship"
    );
    if (selected.length <= 2) return;

    this.isLayoutAnimating = true;
    this.notify();

    const rects = selected.map((s) => ({ id: s.id, x: s.x, y: s.y, width: s.width, height: s.height }));
    const result = distributeSelectedNodes(rects, direction);

    this.transact(() => {
      for (const [id, pos] of result.entries()) {
        this.updateShape(id, pos);
      }
    });

    setTimeout(() => {
      this.isLayoutAnimating = false;
      this.notify();
    }, 500);
  }
}
