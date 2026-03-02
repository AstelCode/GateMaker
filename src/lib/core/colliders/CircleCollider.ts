import type { Vector } from "../math/Vector";

export function pointInsideCircle(center: Vector, p: Vector, radius: number) {
  return p.clone().subtract(center).magnitude() < radius;
}

export class CircleCollider {
  constructor(
    public radius: number,
    public center: Vector,
  ) {}

  pointInside(p: Vector) {
    return pointInsideCircle(this.center, p, this.radius);
  }
}
