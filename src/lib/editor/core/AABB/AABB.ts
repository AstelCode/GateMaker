import { Vector, type VectorData } from "../math/Vector";

export class AABB {
  constructor(
    public width: number = 0,
    public height: number = 0,
    public center: Vector = new Vector(),
  ) {}

  set(width: number, height: number, pos: VectorData) {
    this.width = width;
    this.height = height;
    this.center.set(pos);
  }

  setFromAABB(a: AABB) {
    this.set(a.width, a.height, a.center);
  }

  addPadding(padding: number) {
    this.width += padding * 2;
    this.height += padding * 2;
  }

  get left() {
    return this.center.x - this.width / 2;
  }
  get right() {
    return this.center.x + this.width / 2;
  }
  get top() {
    return this.center.y - this.height / 2;
  }
  get bottom() {
    return this.center.y + this.height / 2;
  }

  setFromTwoPoints(a: VectorData, b: VectorData) {
    const cX = (a.x + b.x) / 2;
    const cY = (a.y + b.y) / 2;
    const w = Math.abs(a.x - b.x);
    const h = Math.abs(a.y - b.y);
    this.width = w;
    this.height = h;
    this.center.set(cX, cY);
  }

  pointInside(pos: VectorData): boolean {
    return (
      pos.x >= this.left &&
      pos.x <= this.right &&
      pos.y >= this.top &&
      pos.y <= this.bottom
    );
  }

  collideAABB(b: AABB): boolean {
    return AABB.collideAABB(this, b);
  }

  containsAABB(b: AABB): boolean {
    return (
      b.left >= this.left &&
      b.right <= this.right &&
      b.top >= this.top &&
      b.bottom <= this.bottom
    );
  }

  static collideAABB(a: AABB, b: AABB): boolean {
    if (a.width == 0 && a.height == 0) return false;
    if (b.width == 0 && b.height == 0) return false;
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  static containsAABB(a: AABB, b: AABB): boolean {
    if (a.width === 0 || a.height === 0) return false;
    if (b.width === 0 || b.height === 0) return false;

    return (
      b.left >= a.left &&
      b.right <= a.right &&
      b.top >= a.top &&
      b.bottom <= a.bottom
    );
  }

  static insideAABB(box: AABB, p: Vector): boolean {
    return (
      p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom
    );
  }

  static merge<T>(
    data: T[],
    func: (item: T) => AABB | undefined,
    output?: AABB,
  ) {
    if (data.length === 0) {
      return undefined;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < data.length; i++) {
      const b = func(data[i]);
      if (!b) continue;
      if (b.left < minX) minX = b.left;
      if (b.top < minY) minY = b.top;
      if (b.right > maxX) maxX = b.right;
      if (b.bottom > maxY) maxY = b.bottom;
    }
    const width = maxX - minX;
    const height = maxY - minY;
    const point = new Vector(minX + width / 2, minY + height / 2);
    if (output) {
      output.set(width, height, point);
    } else {
      return new AABB(width, height, point);
    }
  }
}
