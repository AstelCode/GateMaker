import type { AABB } from "../AABB/AABB";
import type { Vector } from "../math/Vector";
import type { Collider } from "./ICollider";

export function pointInsideCircle(center: Vector, p: Vector, radius: number) {
  return p.clone().subtract(center).magnitude() < radius;
}

export class CircleCollider implements Collider {
  constructor(
    public radius: number,
    public center: Vector,
  ) {}

  getAABB(bounding?: AABB): AABB {
    throw new Error("Method not implemented.");
  }

  pointInside(p: Vector) {
    return pointInsideCircle(this.center, p, this.radius);
  }
}
