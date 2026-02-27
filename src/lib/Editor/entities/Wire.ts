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
  public endPoint: Point;
  public endNode!: NodeEntity;
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

  public startWire(p: Point, node: NodeEntity) {
    this.startPoint.x = p.x;
    this.startPoint.y = p.y;
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.path.push(this.startPoint);
    this.path.push(this.endPoint);
    this.startNode = node;
  }

  public endWire(p: Point, node: NodeEntity) {
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.endNode = node;
    this.completed = true;
    this.drawCable();
  }

  public moveLastPoint(p: Point) {
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.drawCable();
  }

  public addPoint(p: Point) {
    Grid.snap(p);
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
}
