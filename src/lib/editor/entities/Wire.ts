import { Graphics } from "pixi.js";
import { Entity, PathCollider, pointInsideLine, Vector } from "../core";
import { Grid } from "../Grid";
import { ConnectorDirection, type NodeEntity } from "./NodeEntity";
import type { AppContext, AppEvents, AppProviders } from "../App";
import { WireRouter } from "../WireRouter";

interface NodeInfo {
  pin: string;
  node: NodeEntity;
  position: Vector;
  direction: ConnectorDirection;
}

export class Wire extends Entity<AppProviders, AppEvents, AppContext> {
  static lineHeight: number = 12;
  public startNode!: NodeInfo;
  public endNode!: NodeInfo;
  public path: Vector[];
  public points: Vector[];
  public startPos: Vector;
  public endPos: Vector;
  public _cells: number[] = [];
  public completed: boolean;
  private g: Graphics;

  constructor() {
    super();
    this.path = [];
    this.points = [];
    this.zIndex = 1;
    this.startPos = new Vector();
    this.endPos = new Vector();
    this.completed = false;
    this.g = new Graphics();
    this.addChild(this.g);
  }

  public init(): void {
    this.collider = new PathCollider(this.path, Wire.lineHeight);
  }

  public delete() {
    this.startNode.node.deleteWire(this.startNode.pin);
    this.endNode.node.deleteWire(this.startNode.pin);
    this.parent?.removeChild(this);
    this.context.grid.unregisterWire(this);
  }

  public startWire(
    node: NodeEntity,
    name: string,
    pos: Vector,
    direction: ConnectorDirection,
  ) {
    this.startNode = { node, pin: name, position: pos, direction };
    this.startPos.set(pos);
    this.endPos.set(pos);
    this.path.push(this.startPos);
    this.points.push(this.startPos);
  }

  public endWire(
    node: NodeEntity,
    name: string,
    pos: Vector,
    direction: ConnectorDirection,
  ) {
    this.endNode = { node, pin: name, position: pos, direction };
    this.endPos.set(pos);
    this.endNode.node.setWirePos(this.endNode.pin, this, this.endPos);
    this.startNode.node.setWirePos(this.startNode.pin, this, this.startPos);
    this.points.push(this.endPos);
    this.path.push(this.endPos);
    this.completed = true;
    this.recalc();
    this.forceLayoutUpdate();
    this.points.length = 0;
  }

  public addPoint(pos: Vector) {
    Grid.snap(pos);
    pos.x += Grid.cellSize / 2;
    pos.y += Grid.cellSize / 2;
    this.path.push(pos);
    this.points.push(pos);
    this.draw();
  }

  public translate(dx: number, dy: number) {
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      p.x += dx;
      p.y += dy;
    }

    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      p.x += dx;
      p.y += dy;
    }

    this.context.grid.registerWirePath(this, this.path);

    this.markDirty();
  }

  public moveLastPoint(pos: Vector) {
    this.endPos.set(pos);
    this.draw();
  }

  public updateLastSegments() {
    if (this.path.length <= 2) return;
    const a = this.path[this.path.length - 2];
    const b = this.path[1];
    if (this.endNode.direction & ConnectorDirection.HORIZONTAL) {
      a.y = this.endPos.y;
    } else {
      a.x = this.endPos.x;
    }

    if (this.startNode.direction & ConnectorDirection.HORIZONTAL) {
      b.y = this.startPos.y;
    } else {
      b.x = this.startPos.x;
    }
  }

  public fixDiagonalSegments() {
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i];
      const b = this.path[i + 1];
      if (a.x === b.x || a.y === b.y) continue;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      let p1: Vector;
      let p2: Vector;
      if (dx > dy) {
        p1 = new Vector(midX, a.y);
        p2 = new Vector(midX, b.y);
      } else {
        p1 = new Vector(a.x, midY);
        p2 = new Vector(b.x, midY);
      }
      this.path.splice(i + 1, 0, p1, p2);
      i += 2;
    }
  }

  public getSegment(pos: Vector) {
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i];
      const b = this.path[i + 1];
      if (pointInsideLine(a, b, pos, Wire.lineHeight)) {
        return i;
      }
    }
    return -1;
  }

  public moveSegment(idx: number, delta: Vector) {
    if (1 > idx || idx > this.path.length - 1) return;
    const a = this.path[idx];
    const b = this.path[idx + 1];

    if (a.x == b.x) {
      const d = new Vector(delta.x, 0);
      a.add(d);
      b.add(d);
    }

    if (a.y == b.y) {
      const d = new Vector(0, delta.y);
      a.add(d);
      b.add(d);
    }
    this.forceLayoutUpdate();
  }

  public adjustSegment(idx: number) {
    if (1 > idx || idx > this.path.length - 1) return;
    Wire.adjustPoint(this.path[idx]);
    Wire.adjustPoint(this.path[idx + 1]);
    this.forceLayoutUpdate();
  }

  public getNodes() {
    return [this.startNode.node, this.endNode.node];
  }

  static adjustPoint(p: Vector) {
    const cellSize = Grid.cellSize;
    p.y = Math.floor(p.y / cellSize) * cellSize;
    p.x = Math.floor(p.x / cellSize) * cellSize;
    p.x += cellSize / 2;
    p.y += cellSize / 2;
  }

  static adjust(x: number) {
    const cellSize = Grid.cellSize;
    return Math.floor(x / cellSize) * cellSize + cellSize / 2;
  }

  public adjustPathToGrid() {
    for (let i = 1; i < this.points.length - 1; i++) {
      const p = this.points[i];
      Wire.adjustPoint(p);
    }
    for (let i = 1; i < this.path.length - 1; i++) {
      const p = this.path[i];
      Wire.adjustPoint(p);
    }
  }

  public draw() {
    this.g.clear();
    this.g.beginPath();
    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      if (i == 0) this.g.moveTo(p.x, p.y);
      else this.g.lineTo(p.x, p.y);
    }
    if (!this.completed) this.g.lineTo(this.endPos.x, this.endPos.y);
    this.g.stroke({ color: 0x000000, join: "round", width: Wire.lineHeight });

    this.g.beginPath();
    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      if (i == 0) this.g.moveTo(p.x, p.y);
      else this.g.lineTo(p.x, p.y);
    }
    if (!this.completed) this.g.lineTo(this.endPos.x, this.endPos.y);
    this.g.stroke({
      color: 0xffffff,
      join: "round",
      width: Wire.lineHeight - 3,
    });
  }

  protected onDirty(): void {
    this.draw();
  }

  public recalc() {
    //const grid = AppEvents.get("grid")!;
    this.context.grid.unregisterWire(this);
    if (this.points.length == 0) {
      this.points.push(this.startPos);
      this.points.push(this.endPos);
    }

    let fullPath: Vector[] = [];

    for (let i = 0; i < this.points.length - 1; i++) {
      const from = this.points[i];
      const to = this.points[i + 1];

      // Dirección inicial solo en el primer tramo
      let startDir: Vector | undefined;
      if (i === 0) {
        startDir = new Vector(from.x > this.startNode.position.x ? 1 : -1, 0);
      }

      // Dirección final solo en el último tramo
      let endDir: Vector | undefined;
      if (i === this.points.length - 2) {
        endDir = new Vector(to.x < this.endNode.position.x ? -1 : 1, 0);
      }

      const segment = WireRouter.route(
        this.context.grid,
        from,
        to,
        startDir,
        this,
      );

      if (segment.length === 0) continue;

      // Evitar duplicar el punto de unión
      if (i > 0) segment.shift();

      fullPath.push(...segment);
    }

    if (fullPath.length === 0) {
      fullPath = this.points;
    }
    this.context.grid.registerWirePath(this, fullPath);
    fullPath.unshift(this.startPos);
    fullPath.push(this.endPos);
    const simplified = WireRouter.simplifyPath(fullPath);
    this.path.length = 0;
    for (const p of simplified) this.path.push(p);
    this.markDirty();
  }
}
