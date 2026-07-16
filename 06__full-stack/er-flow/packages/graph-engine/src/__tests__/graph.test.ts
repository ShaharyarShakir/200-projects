import { describe, it, expect } from "vitest";
import {
  detectCycles,
  findTreeRoots,
  topologicalSort,
  computeDegrees,
  rotatePoint,
  computeTreeLayout,
  computeCircularLayout,
  computeGridLayout,
  computeForceLayout,
  resolveCollisions,
  calculateSnapping,
  alignSelectedNodes,
  distributeSelectedNodes,
  calculateSmartOrthogonalRoute
} from "../index";

describe("Graph Engine Traversal & Math", () => {
  it("should detect cycles in directed graphs", () => {
    const nodeIds = ["A", "B", "C", "D"];
    const cyclicEdges = [
      { source: "A", target: "B" },
      { source: "B", target: "C" },
      { source: "C", target: "A" },
      { source: "C", target: "D" }
    ];
    const cycles = detectCycles(nodeIds, cyclicEdges);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it("should find tree root nodes", () => {
    const nodeIds = ["A", "B", "C", "D"];
    const edges = [
      { source: "A", target: "B" },
      { source: "A", target: "C" },
      { source: "C", target: "D" }
    ];
    const roots = findTreeRoots(nodeIds, edges);
    expect(roots).toEqual(["A"]);
  });

  it("should topologically sort DAGs", () => {
    const nodeIds = ["A", "B", "C"];
    const edges = [
      { source: "A", target: "B" },
      { source: "B", target: "C" }
    ];
    const order = topologicalSort(nodeIds, edges);
    expect(order).toEqual(["A", "B", "C"]);
  });

  it("should calculate node degree indicators", () => {
    const nodeIds = ["A", "B", "C"];
    const edges = [
      { source: "A", target: "B" },
      { source: "A", target: "C" }
    ];
    const degreeMap = computeDegrees(nodeIds, edges);
    expect(degreeMap.get("A")?.outDegree).toBe(2);
  });
});

describe("Graph Layout Engines", () => {
  it("should calculate Circular layout coordinates", () => {
    const nodeIds = ["A", "B", "C", "D"];
    const positions = computeCircularLayout(nodeIds, { x: 0, y: 0 }, 100);
    expect(positions.size).toBe(4);
    const posA = positions.get("A")!;
    expect(posA.x).toBe(160);
  });

  it("should calculate Grid layout positions", () => {
    const nodeIds = ["A", "B", "C", "D"];
    const positions = computeGridLayout(nodeIds, 2, 100, 100);
    expect(positions.get("A")).toEqual({ x: 0, y: 0 });
    expect(positions.get("B")).toEqual({ x: 100, y: 0 });
    expect(positions.get("C")).toEqual({ x: 0, y: 100 });
  });

  it("should calculate Tree layout hierarchy positions", () => {
    const nodeIds = ["root", "child1", "child2"];
    const edges = [
      { source: "root", target: "child1" },
      { source: "root", target: "child2" }
    ];
    const positions = computeTreeLayout(nodeIds, edges, { siblingSpacing: 100, levelSpacing: 100 });
    expect(positions.get("child1")?.y).toBe(100);
    expect(positions.get("child2")?.y).toBe(100);
    expect(positions.get("root")?.y).toBe(0);
    // parent root centers between children
    const midX = (positions.get("child1")!.x + positions.get("child2")!.x) / 2;
    expect(positions.get("root")!.x).toBeCloseTo(midX);
  });

  it("should run stabilized multi-pass Force directed simulation", () => {
    const nodeIds = ["A", "B"];
    const edges = [{ source: "A", target: "B" }];
    const start = new Map([
      ["A", { x: 0, y: 0 }],
      ["B", { x: 5, y: 0 }]
    ]);
    const finalPositions = computeForceLayout(nodeIds, edges, start, 5);
    expect(finalPositions.size).toBe(2);
  });
});

describe("Collision & Snapping Guides", () => {
  it("should push colliding node rectangles apart", () => {
    const rects = [
      { id: "1", x: 0, y: 0, width: 50, height: 50 },
      { id: "2", x: 10, y: 10, width: 50, height: 50 } // overlapping
    ];
    const resolved = resolveCollisions(rects, 10);
    const r1 = resolved.get("1")!;
    const r2 = resolved.get("2")!;
    // verify they are no longer overlapping at (0,0) and (10,10)
    expect(Math.abs(r1.x - r2.x) >= 60 || Math.abs(r1.y - r2.y) >= 60).toBe(true);
  });

  it("should snap to alignment guides and return guidelines details", () => {
    const otherNodes = [
      { id: "target", x: 100, y: 100, width: 50, height: 50 }
    ];
    const dragging = { x: 102, y: 250, width: 50, height: 50 }; // within snap threshold of x=100
    const result = calculateSnapping("drag", dragging, otherNodes, 8);
    
    expect(result.snappedX).toBe(100); // snapped to target.x
    expect(result.guides.length).toBeGreaterThan(0);
    expect(result.guides[0].x1).toBe(100);
  });
});

describe("Alignment & Distribute Tools", () => {
  const rects = [
    { id: "1", x: 10, y: 100, width: 50, height: 50 },
    { id: "2", x: 20, y: 120, width: 50, height: 50 },
    { id: "3", x: 15, y: 80, width: 50, height: 50 }
  ];

  it("should align shapes left coordinate", () => {
    const aligned = alignSelectedNodes(rects, "left");
    expect(aligned.get("1")?.x).toBe(10);
    expect(aligned.get("2")?.x).toBe(10);
    expect(aligned.get("3")?.x).toBe(10);
  });

  it("should distribute shapes with equal gap spaces", () => {
    const distributed = distributeSelectedNodes(rects, "horizontal");
    // Sort order x-coords should be evenly spaced
    const x1 = distributed.get("1")!.x;
    const x2 = distributed.get("3")!.x;
    const x3 = distributed.get("2")!.x;
    
    const diff1 = x2 - x1;
    const diff2 = x3 - x2;
    expect(diff1).toBeCloseTo(diff2);
  });
});

describe("Smart Path Edge Router", () => {
  it("should calculate detour orthogonal points avoiding node boxes", () => {
    const start = { x: 0, y: 100 };
    const end = { x: 200, y: 100 };
    // Node sitting directly in path of straight line
    const obstacles = [
      { id: "obs", x: 80, y: 80, width: 40, height: 40 }
    ];

    const route = calculateSmartOrthogonalRoute(start, end, obstacles, 15);
    expect(route.length).toBeGreaterThan(2); // must detour, creating bend points
    
    // detour segments should not penetrate the obstacle box bounds [80, 120] along y = [80, 120]
    for (const pt of route) {
      const insideX = pt.x > 80 && pt.x < 120;
      const insideY = pt.y > 80 && pt.y < 120;
      expect(insideX && insideY).toBe(false);
    }
  });
});
