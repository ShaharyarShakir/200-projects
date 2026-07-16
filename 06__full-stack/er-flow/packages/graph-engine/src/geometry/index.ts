export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export function rotatePoint(pt: Point, center: Point, angleDegrees: number): Point {
  if (angleDegrees === 0 || !angleDegrees) return pt;
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = pt.x - center.x;
  const dy = pt.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function getCenter(rect: { x: number; y: number; width: number; height: number }): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function distanceToSegment(pt: Point, p1: Point, p2: Point): number {
  const A = pt.x - p1.x;
  const B = pt.y - p1.y;
  const C = p2.x - p1.x;
  const D = p2.y - p1.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = p1.x;
    yy = p1.y;
  } else if (param > 1) {
    xx = p2.x;
    yy = p2.y;
  } else {
    xx = p1.x + param * C;
    yy = p1.y + param * D;
  }

  const dx = pt.x - xx;
  const dy = pt.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isPointInRect(pt: Point, rect: { x: number; y: number; width: number; height: number; rotation?: number }): boolean {
  const center = getCenter(rect);
  const rotation = rect.rotation || 0;
  const localPt = rotatePoint(pt, center, -rotation);
  return (
    localPt.x >= rect.x &&
    localPt.x <= rect.x + rect.width &&
    localPt.y >= rect.y &&
    localPt.y <= rect.y + rect.height
  );
}

export function isPointInCircle(pt: Point, circle: { x: number; y: number; width: number; height: number }): boolean {
  const center = getCenter(circle);
  const rx = circle.width / 2;
  const ry = circle.height / 2;
  if (rx === 0 || ry === 0) return false;

  const dx = pt.x - center.x;
  const dy = pt.y - center.y;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

export function isPointInDiamond(pt: Point, diamond: { x: number; y: number; width: number; height: number; rotation?: number }): boolean {
  const center = getCenter(diamond);
  const rotation = diamond.rotation || 0;
  const localPt = rotatePoint(pt, center, -rotation);
  const rx = diamond.width / 2;
  const ry = diamond.height / 2;
  if (rx === 0 || ry === 0) return false;

  const dx = Math.abs(localPt.x - center.x) / rx;
  const dy = Math.abs(localPt.y - center.y) / ry;
  return dx + dy <= 1;
}

export function isPointNearLine(pt: Point, points: Point[], threshold = 8): boolean {
  if (points.length < 2) return false;
  for (let i = 0; i < points.length - 1; i++) {
    if (distanceToSegment(pt, points[i], points[i + 1]) <= threshold) {
      return true;
    }
  }
  return false;
}

export function getDiamondPath(rect: { x: number; y: number; width: number; height: number }): string {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const w2 = rect.width / 2;
  const h2 = rect.height / 2;
  return `M ${cx} ${cy - h2} L ${cx + w2} ${cy} L ${cx} ${cy + h2} L ${cx - w2} Z`;
}

export function rectsIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  const r1x1 = Math.min(r1.x, r1.x + r1.width);
  const r1x2 = Math.max(r1.x, r1.x + r1.width);
  const r1y1 = Math.min(r1.y, r1.y + r1.height);
  const r1y2 = Math.max(r1.y, r1.y + r1.height);

  const r2x1 = Math.min(r2.x, r2.x + r2.width);
  const r2x2 = Math.max(r2.x, r2.x + r2.width);
  const r2y1 = Math.min(r2.y, r2.y + r2.height);
  const r2y2 = Math.max(r2.y, r2.y + r2.height);

  return !(
    r2x1 > r1x2 ||
    r2x2 < r1x1 ||
    r2y1 > r1y2 ||
    r2y2 < r1y1
  );
}

export function getArrowHeadPoints(
  p1: Point,
  p2: Point,
  arrowLength = 15,
  arrowAngle = 30
): { left: Point; right: Point } {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx);

  const angleRad = (arrowAngle * Math.PI) / 180;

  const leftAngle = angle - angleRad;
  const rightAngle = angle + angleRad;

  return {
    left: {
      x: p2.x - arrowLength * Math.cos(leftAngle),
      y: p2.y - arrowLength * Math.sin(leftAngle),
    },
    right: {
      x: p2.x - arrowLength * Math.cos(rightAngle),
      y: p2.y - arrowLength * Math.sin(rightAngle),
    },
  };
}
