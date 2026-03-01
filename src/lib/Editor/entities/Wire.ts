import { Graphics, Point } from "pixi.js";
import {
  Entity,
  type Context,
  type DefaultEvents,
  type DefaultProvider,
} from "../core";
import { Grid } from "./Grid";
import type { NodeEntity } from "./NodeEntity";

export class Wire extends Entity {
  private g: Graphics;
  public startPoint: Point;
  public startNode!: NodeEntity;
  public startPin!: string;

  public endPoint: Point;
  public endNode!: NodeEntity;
  public endPin!: string;

  public path: Point[];
  public completed: boolean;

  constructor() {
    super();
    this.startPoint = new Point();
    this.endPoint = new Point();
    this.g = new Graphics();
    this.path = [];
    this.addChild(this.g);
    this.zIndex = 1;
    this.completed = false;
  }

  protected onInit(context: Context<DefaultProvider, DefaultEvents>): void {
    this.drawCable();
  }

  public startWire(p: Point, node: NodeEntity, name: string) {
    this.startPin = name;
    this.startPoint.x = p.x;
    this.startPoint.y = p.y;
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.path.push(this.startPoint);
    this.path.push(this.endPoint);
    this.startNode = node;
  }

  public endWire(p: Point, node: NodeEntity, name: string) {
    this.endPin = name;
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.endNode = node;
    this.completed = true;
    this.endNode.setWirePos(this.endPin, this, this.endPoint);
    this.startNode.setWirePos(this.startPin, this, this.startPoint);
    this.drawCable();
  }

  public moveLastPoint(p: Point) {
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.drawCable();
  }

  public addPoint(p: Point) {
    Grid.snapFloor(p);
    const cellSize = Grid.CELL_SIZE;
    p.x += cellSize / 2;
    p.y += cellSize / 2;
    this.path.splice(this.path.length - 1, 0, p);
    this.drawCable();
  }

  private drawCable() {
    this.g.clear();
    this.g.beginPath();
    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      if (i == 0) this.g.moveTo(p.x, p.y);
      else this.g.lineTo(p.x, p.y);
    }
    this.g.stroke({
      width: 15,
      color: 0xbbbbbb,
      cap: this.completed ? "square" : "round",
      join: "round",
    });
    this.g.beginPath();
    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      if (i == 0) this.g.moveTo(p.x, p.y);
      else this.g.lineTo(p.x, p.y);
    }
    this.g.stroke({
      width: 10,
      color: 0xffffff,
      cap: this.completed ? "square" : "round",
      join: "round",
    });
  }

  snapPos() {
    this.pivot.set(0, 0);
    const cs = Grid.CELL_SIZE;
    for (let i = 1; i < this.path.length - 1; i++) {
      const point = this.path[i];
      point.x -= cs / 2;
      point.y -= cs / 2;
      Grid.snapRound(point);
      point.x += cs / 2;
      point.y += cs / 2;
    }
    this.drawCable();
  }

  public move(dx: number, dy: number) {
    for (const point of this.path) {
      point.x += dx;
      point.y += dy;
    }
    this.drawCable();
  }

  public getSelectionBounds():
    | { minX: number; minY: number; maxX: number; maxY: number }
    | undefined {
    if (this.path.length === 0) return undefined;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const point of this.path) {
      if (minX > point.x) minX = point.x;
      if (minY > point.y) minY = point.y;
      if (maxX < point.x) maxX = point.x;
      if (maxY < point.y) maxY = point.y;
    }
    return {
      minX: minX + this.position.x,
      minY: minY + this.position.y,
      maxX: maxX + this.position.x,
      maxY: maxY + this.position.y,
    };
  }
}
