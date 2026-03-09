import { Graphics } from "pixi.js";
import {
  Entity,
  PathCollider,
  pointInsideLine,
  Vector,
  type EngineMouseEvent,
} from "../core";
import { Grid } from "../Grid";
import {
  ConnectorDirection,
  ConnectorType,
  type NodeEntity,
} from "./NodeEntity";
import type { AppContext, AppEvents, AppProviders } from "../App";
import { WireRouter } from "../WireRouter";
import { SelectionBox } from "./SelectionBox";

interface NodeInfo {
  pin: string;
  node: NodeEntity;
  position: Vector;
  direction: ConnectorDirection;
}

export class Wire extends Entity<AppProviders, AppEvents, AppContext> {
  static lineHeight: number = 12;
  static padding: number = 15;
  public startNode!: NodeInfo;
  public endNode!: NodeInfo;
  public path: Vector[];
  public points: Vector[];
  public startPos: Vector;
  public endPos: Vector;
  public _cells: number[] = [];
  public completed: boolean;
  public selected: boolean = false;
  public activeIdx: number = -1;
  public memId: number;
  public size: number;

  private g: Graphics;
  private activeStateLayer: Graphics;

  constructor() {
    super();
    this.path = [];
    this.points = [];
    this.zIndex = 1;
    this.startPos = new Vector();
    this.endPos = new Vector();
    this.completed = false;
    this.g = new Graphics();
    this.activeStateLayer = new Graphics();
    this.memId = -1;
    this.addChild(this.g);
    this.addChild(this.activeStateLayer);
    this.size = 0;
  }

  public init(): void {
    this.collider = new PathCollider(this.path, Wire.lineHeight + Wire.padding);
  }

  public delete() {
    this.startNode.node.deleteWire(this.startNode.pin, this);
    this.endNode.node.deleteWire(this.endNode.pin, this);
    this.parent?.removeChild(this);
    this.context.grid.unregisterWire(this);
  }

  private drawPath(g = this.g) {
    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      if (i == 0) g.moveTo(p.x, p.y);
      else g.lineTo(p.x, p.y);
    }
  }
  private active: boolean = false;

  public onUpdate(): void {
    if (this.context.simulator.started) {
      if (this.context.simulator.memory.get(this.memId)) {
        if (!this.active) {
          this.active = true;
          this.draw();
        }
      } else {
        if (this.active) {
          this.active = false;
          this.draw();
        }
      }
    }
  }

  public select() {
    this.selected = true;
    this.draw();
  }

  public unSelect() {
    this.selected = false;
    this.draw();
  }

  public draw() {
    this.g.clear();

    if (this.selected) {
      this.g.beginPath();
      this.drawPath();
      if (!this.completed) this.g.lineTo(this.endPos.x, this.endPos.y);
      this.g.stroke({
        color: SelectionBox.color,
        join: "round",
        cap: "round",
        width: Wire.lineHeight + 5,
      });
    }

    this.g.beginPath();
    this.drawPath();
    if (!this.completed) this.g.lineTo(this.endPos.x, this.endPos.y);
    this.g.stroke({
      color: 0x000000,
      join: "round",
      cap: "round",
      width: Wire.lineHeight,
    });

    this.g.beginPath();
    this.drawPath();
    if (!this.completed) this.g.lineTo(this.endPos.x, this.endPos.y);
    this.g.stroke({
      color: this.active ? "#F57F7F" : "#ffffff",
      join: "round",
      cap: "round",
      width: Wire.lineHeight - 3,
    });
    this.g.beginPath();
    if (this.activeIdx != -1 && this.path.length > 0) {
      const start = this.path[this.activeIdx];
      const end = this.path[this.activeIdx + 1];
      if (!start || !end) return;
      this.g.beginPath();
      this.g.moveTo(start.x, start.y);
      this.g.lineTo(end.x, end.y);
      this.g.stroke({
        color: SelectionBox.color,
        join: "round",
        cap: "round",
        alpha: 0.5,
        width: Wire.lineHeight + 5,
      });
    }
  }

  protected onDirty(): void {
    this.draw();
  }

  //#region selection
  public getSegment(pos: Vector) {
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i];
      const b = this.path[i + 1];
      if (pointInsideLine(a, b, pos, Wire.lineHeight + Wire.padding)) {
        if (1 > i || i > this.path.length - 3) return -1;
        return i;
      }
    }

    return -1;
  }
  //#endregion

  //#region create
  public startWire(
    node: NodeEntity,
    name: string,
    pos: Vector,
    direction: ConnectorDirection,
    size: number,
  ) {
    this.startNode = { node, pin: name, position: pos, direction };
    this.startPos.set(pos);
    this.endPos.set(pos);
    this.path.push(this.startPos);
    this.points.push(this.startPos);
    this.size = size;
  }

  public endWire(
    node: NodeEntity,
    name: string,
    pos: Vector,
    direction: ConnectorDirection,
  ) {
    this.endNode = { node, pin: name, position: pos, direction };
    this.endPos.set(pos);
    this.endNode.node.connectWire(this.endNode.pin, this, this.endPos);
    this.startNode.node.connectWire(this.startNode.pin, this, this.startPos);
    this.points.push(this.endPos);
    this.path.push(this.endPos);
    this.completed = true;
    this.recalc();
    this.points.length = 0;
    this.forceLayoutUpdate();

    if (
      this.startNode.node.getConnectorInfo(this.startNode.pin).type ==
      ConnectorType.INPUT
    ) {
      const id = this.endNode.node.outputsAddress[this.endNode.pin];
      this.memId = id;
      this.startNode.node.inputsAddress[this.startNode.pin] = this.memId;
    } else {
      const id = this.startNode.node.outputsAddress[this.startNode.pin];
      this.memId = id;
      this.endNode.node.inputsAddress[this.endNode.pin] = this.memId;
    }
  }

  public addPoint(pos: Vector) {
    Grid.snap(pos);
    pos.x += Grid.cellSize / 2;
    pos.y += Grid.cellSize / 2;
    this.path.push(pos);
    this.points.push(pos);
    this.draw();
  }
  //#endregion

  //#region drag
  public moveSegment(idx: number, delta: Vector) {
    if (1 > idx || idx > this.path.length - 3) return;
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
  //#endregion

  //#region update path
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

  public adjustSegment(idx: number) {
    if (1 > idx || idx > this.path.length - 3) return;
    Wire.adjustPoint(this.path[idx]);
    Wire.adjustPoint(this.path[idx + 1]);
    this.forceLayoutUpdate();
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
      /*       let endDir: Vector | undefined;
      if (i === this.points.length - 2) {
        endDir = new Vector(to.x < this.endNode.position.x ? -1 : 1, 0);
      } */

      const segment = WireRouter.route(
        this.context.grid,
        from,
        to,
        startDir,
        this,
      );

      if (segment.length === 0) continue;

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
    this.forceLayoutUpdate();
  }

  static adjustPoint(p: Vector) {
    const cellSize = Grid.cellSize;
    p.y = Math.floor(p.y / cellSize) * cellSize;
    p.x = Math.floor(p.x / cellSize) * cellSize;
    p.x += cellSize / 2;
    p.y += cellSize / 2;
  }

  //#endregion

  //#region node relation
  public getNodes() {
    return [this.startNode.node, this.endNode.node];
  }

  //#endregion

  public unSelectSegment() {
    this.activeIdx = -1;
    this.draw();
  }

  protected onMouseHover(): boolean | void {
    if (this.activeIdx != -1) {
      this.context.mouse.cursor = "pointer";
      this.draw();
    } else {
      this.context.mouse.cursor = "default";
    }
  }

  protected onMouseLeave(): boolean | void {
    this.context.mouse.cursor = "default";
    this.activeIdx = -1;
    this.draw();
  }

  protected onMouseMove(e: EngineMouseEvent): boolean | void {
    if (this.context.simulator.started) return;
    const p = new Vector(e.wX, e.wY);
    this.activeIdx = this.getSegment(p);
    if (this.activeIdx != -1) {
      this.context.mouse.cursor = "pointer";
    } else {
      this.context.mouse.cursor = "default";
    }
    this.draw();
  }
}
