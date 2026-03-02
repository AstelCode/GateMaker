import type { Vector } from "../math/Vector";
import type { Collider } from "./ICollider";

export function pointInsideLine(
  a: Vector,
  b: Vector,
  p: Vector,
  height: number,
) {
  const r = height * 0.5;
  const r2 = r * r;
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  const vx = bx - ax;
  const vy = by - ay;
  const wx = p.x - ax;
  const wy = p.y - ay;
  const c1 = wx * vx + wy * vy;
  const c2 = vx * vx + vy * vy;
  let t = c1 / c2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const projx = ax + t * vx;
  const projy = ay + t * vy;
  const dx = p.x - projx;
  const dy = p.y - projy;
  return dx * dx + dy * dy <= r2;
}

export function pointInsidePath(p: Vector, path: Vector[], height: number) {
  for (let i = 0; i < path.length - 1; i++) {
    if (pointInsideLine(path[i], path[i + 1], p, height)) return true;
  }
  return false;
}

export class LineCollider implements Collider {
  constructor(
    public path: Vector[] = [],
    public height: number,
  ) {}

  //draw(ctx: CanvasRenderingContext2D): void {
  //  ctx.save();
  //  ctx.beginPath();
  //  ctx.lineWidth = this.height;
  //  for (let i = 0; i < this.path.length; i++) {
  //    const p = this.path[i];
  //    if (i === 0) ctx.moveTo(p.x, p.y);
  //    else ctx.lineTo(p.x, p.y);
  //  }
  //  ctx.strokeStyle = "green";
  //  ctx.stroke();
  //  ctx.restore();
  //}

  updateData(path: Vector[], height?: number) {
    this.path = path;
    if (height) this.height = height;
  }

  pointInsideBox(pos: Vector): boolean {
    return pointInsidePath(pos, this.path, this.height);
  }
}
