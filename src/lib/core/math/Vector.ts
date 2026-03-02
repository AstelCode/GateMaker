export type VectorData = { x: number; y: number };

export class Vector {
  public x: number = 0;
  public y: number = 0;

  constructor(a?: VectorData);
  constructor(x?: number, y?: number);
  constructor(a: VectorData | number = 0, b: number = 0) {
    if (typeof a == "object") {
      this.x = a.x;
      this.y = a.y;
    } else {
      this.x = a;
      this.y = b;
    }
  }

  //#region object attributes

  clone(): Vector {
    return new Vector(this.x, this.y);
  }

  copy(v: Vector): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  set(a: number | VectorData = 0, b: number = 0) {
    if (typeof a == "object") {
      this.x = a.x;
      this.y = a.y;
    } else {
      this.x = a;
      this.y = b;
    }
  }

  equals(v: VectorData): boolean {
    return this.x === v.x && this.y === v.y;
  }

  toString(): string {
    return `Vector2D(${this.x}, ${this.y})`;
  }

  //#endregion

  //#region arithmetic operations

  add(v: VectorData): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  subtract(v: VectorData): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiply(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divide(scalar: number): this {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  //#endregion

  //#region angle operations
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleBetween(v: Vector): number {
    const dot = this.dot(v);
    const magProduct = this.magnitude() * v.magnitude();

    if (magProduct === 0) return 0;

    return Math.acos(dot / magProduct);
  }

  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;

    this.x = x;
    this.y = y;

    return this;
  }

  static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  //#endregion

  //#region vector operations
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): this {
    const mag = this.magnitude();
    if (mag !== 0) {
      this.divide(mag);
    }
    return this;
  }

  distance(v: VectorData): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  dot(v: VectorData): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: VectorData): number {
    return this.x * v.y - this.y * v.x;
  }

  normal(): Vector {
    return new Vector(-this.y, this.x);
  }

  normalRight(): Vector {
    return new Vector(this.y, -this.x);
  }

  unitNormal(): Vector {
    return this.normal().normalize();
  }

  abs(): Vector {
    return new Vector(Math.abs(this.x), Math.abs(this.y));
  }
  //#endregion
}
