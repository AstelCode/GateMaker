import { Graphics, Point } from "pixi.js";
import { Entity, type BoundingBox } from "../core";
import { Grid } from "./Grid";

export class SelectionBox extends Entity {
  g: Graphics;
  startPos: Point;
  endPos: Point;
  max: Point;
  min: Point;

  // UI Constants for easy tweaking
  private readonly FILL_COLOR = 0x327da8;
  private readonly FILL_ALPHA = 0.2;

  constructor() {
    super();
    this.g = new Graphics();
    this.addChild(this.g);
    this.startPos = new Point();
    this.endPos = new Point();
    this.max = new Point();
    this.min = new Point();
    this.zIndex = 5;
  }

  setStartPoint(p: Point) {
    this.startPos.copyFrom(p);
    this.endPos.copyFrom(p);
    this.updateBound();
    this.drawBox();
  }

  setLastPoint(p: Point) {
    this.endPos.copyFrom(p);
    this.updateBound();
    this.drawBox();
  }

  updateBound() {
    this.min.x = Math.min(this.startPos.x, this.endPos.x);
    this.min.y = Math.min(this.startPos.y, this.endPos.y);
    this.max.x = Math.max(this.startPos.x, this.endPos.x);
    this.max.y = Math.max(this.startPos.y, this.endPos.y);
  }

  fromBounding(box: BoundingBox) {
    this.startPos.set(box.minX, box.minY);
    this.endPos.set(box.maxX, box.maxY);
    this.updateBound();
    this.drawBox();
  }

  snap() {
    Grid.snapRound(this.startPos);
    Grid.snapRound(this.endPos);
    this.updateBound();
  }

  clearBox() {
    this.g.clear();
    this.startPos.set(0, 0);
    this.endPos.set(0, 0);
    this.min.set(0, 0);
    this.max.set(0, 0);
  }

  drawBox() {
    this.g.clear();
    const width = this.max.x - this.min.x;
    const height = this.max.y - this.min.y;

    if (width === 0 || height === 0) return;

    this.g.rect(this.min.x, this.min.y, width, height);
    this.g.fill({ color: this.FILL_COLOR, alpha: this.FILL_ALPHA });
    this.g.stroke({ width: 1, color: this.FILL_COLOR });
  }

  drag(dx: number, dy: number) {
    this.startPos.x += dx;
    this.startPos.y += dy;
    this.endPos.x += dx;
    this.endPos.y += dy;
    this.updateBound();
    this.drawBox();
  }
  collide(bound: BoundingBox) {
    return (
      this.min.x < bound.minX &&
      bound.maxX < this.max.x &&
      this.min.y < bound.minY &&
      bound.maxY < this.max.y
    );
  }

  inside(x: number, y: number) {
    return (
      x >= this.min.x && x <= this.max.x && y >= this.min.y && y <= this.max.y
    );
  }
}
