import { Container, Graphics } from "pixi.js";
import { AABB, Entity, Vector, type VectorData } from "../core";

export class SelectionBox extends Container {
  static color = 0x505050;
  static alpha = 0.2;

  bounding: AABB;
  start: Vector;
  end: Vector;
  g: Graphics;
  padding: number;

  constructor() {
    super();
    this.padding = 10;
    this.bounding = new AABB();
    this.start = new Vector();
    this.end = new Vector();
    this.g = new Graphics();
    this.addChild(this.g);
    this.zIndex = 5;
  }

  setStart(v: VectorData) {
    this.start.set(v);
    this.end.set(v);
    this.bounding.setFromTwoPoints(this.start, this.end);
    this.drawBox();
  }

  setEnd(p: VectorData) {
    this.end.set(p);
    this.bounding.setFromTwoPoints(this.start, this.end);
    this.drawBox();
  }

  drag(dx: number, dy: number) {
    this.bounding.center.add(new Vector(dx, dy));
    this.drawBox();
  }

  clear() {
    this.g.clear();
    this.start.set(0);
    this.end.set(0);
    this.bounding.setFromTwoPoints(this.start, this.end);
  }

  calcBounding(e: (Entity | undefined)[]) {
    AABB.merge(e, (e) => e && e.bounding, this.bounding);
    this.bounding.addPadding(this.padding);
    this.drawBox();
  }

  updateBounding() {
    this.start.add(this.position);
    this.end.add(this.position);
    this.bounding.setFromTwoPoints(this.start, this.end);
    this.position.set(0, 0);
    this.drawBox();
  }

  drawBox() {
    this.g.clear();
    this.g.rect(
      this.bounding.left,
      this.bounding.top,
      this.bounding.width,
      this.bounding.height,
    );
    this.g.fill({ color: SelectionBox.color, alpha: SelectionBox.alpha });
    this.g.stroke({ width: 1, color: SelectionBox.color });
  }
}
