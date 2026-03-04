import type { AABB } from "../AABB/AABB";
import { Vector } from "../math/Vector";

export interface Collider {
  pointInside(pos: Vector): boolean;
  getAABB(bounding?: AABB): AABB;
  //draw(context:Conte): void;
}
