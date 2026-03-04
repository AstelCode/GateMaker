import { AABB } from "../AABB/AABB";
import { Vector } from "../math/Vector";
import type { Collider } from "./ICollider";

export function pointInsideBox(
  p: Vector,
  center: Vector,
  halfW: number,
  halfH: number,
  angle = 0,
) {
  const v = p.clone().subtract(center).rotate(-angle);
  return -halfW <= v.x && v.x <= halfW && -halfH <= v.y && v.y <= halfH;
}

export class BoxCollider implements Collider {
  private halfW = 0;
  private halfH = 0;

  constructor(
    public width: number,
    public height: number,
    public center = new Vector(),
    public angle: number = 0,
  ) {
    this.halfW = width / 2;
    this.halfH = height / 2;
  }

  getAABB(bounding?: AABB): AABB {
    if (!bounding) bounding = new AABB();
    bounding.set(this.width, this.height, this.center);
    return bounding;
  }

  set(width: number, height: number, pos: Vector, angle: number = 0) {
    this.width = width;
    this.height = height;
    this.center.copy(pos);
    this.angle = angle;
    this.halfW = width / 2;
    this.halfH = height / 2;
  }

  pointInside(p: Vector): boolean {
    return pointInsideBox(this.center, p, this.halfW, this.halfH, this.angle);
  }
}
