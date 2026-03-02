import { Graphics, Point } from "pixi.js";
import {
  Entity,
  type Context,
  type DefaultEvents,
  type DefaultProvider,
} from "../core";
import { Grid } from "./Grid";
import type { NodeEntity } from "./NodeEntity";
import { WireRouter } from "../provitional/WireRouter"; // Asegúrate de ajustar esta ruta
import type { AppEvents, AppProviders } from "../provitional/App";

export class Wire extends Entity {
  private g: Graphics;
  public startPoint: Point;
  public startNode!: NodeEntity;
  public startPin!: string;

  public endPoint: Point;
  public endNode!: NodeEntity;
  public endPin!: string;

  public path: Point[];
  public points: Point[]; // NUEVO: Waypoints lógicos para el enrutamiento
  public completed: boolean;

  // NUEVO: Claves de celdas registradas en el Grid para facilitar la limpieza
  public _cells: number[] = [];

  private context!: Context<AppProviders, AppEvents>;

  constructor() {
    super();
    this.startPoint = new Point();
    this.endPoint = new Point();
    this.g = new Graphics();
    this.path = [];
    this.points = [];
    this.addChild(this.g);
    this.zIndex = 1;
    this.completed = false;
  }

  protected onInit(context: Context<AppProviders, AppEvents>): void {
    this.context = context;
    this.draw();
  }

  public startWire(p: Point, node: NodeEntity, name: string) {
    this.startPin = name;
    this.startPoint.x = p.x;
    this.startPoint.y = p.y;
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;

    this.startNode = node;

    this.path.push(this.startPoint, this.endPoint);
    this.points.push(this.startPoint);
  }

  public endWire(p: Point, node: NodeEntity, name: string) {
    this.endPin = name;
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.endNode = node;
    this.completed = true;

    this.endNode.setWirePos(this.endPin, this, this.endPoint);
    this.startNode.setWirePos(this.startPin, this, this.startPoint);

    this.points.push(this.endPoint);
    //this.path.push(this.endPoint);

    this.recalc(); // Calculamos la ruta final
    this.points.length = 0;
  }

  public moveLastPoint(p: Point) {
    this.endPoint.x = p.x;
    this.endPoint.y = p.y;
    this.draw();
  }

  public addPoint(p: Point) {
    Grid.snapFloor(p);
    const cellSize = Grid.CELL_SIZE;
    p.x += cellSize / 2;
    p.y += cellSize / 2;

    this.points.push(p); // Añadimos waypoint
    this.path.splice(this.path.length - 1, 0, p);
    this.draw();
  }

  // --- RECALC: ENRUTAMIENTO AUTOMÁTICO ---
  public recalc() {
    const grid = this.context.provider.get("grid")!;
    grid.unregisterWire(this);

    //if (this.points.length === 0) {
    //  this.points.push(this.startPoint, this.endPoint);
    //}

    let fullPath: Point[] = [];

    for (let i = 0; i < this.points.length - 1; i++) {
      const from = this.points[i];
      const to = this.points[i + 1];

      // Dirección inicial para salir recto del pin del nodo
      let startDir: Point | undefined;
      if (i === 0) {
        startDir = new Point(from.x > this.startNode.position.x ? 1 : -1, 0);
      }

      // Dirección final para entrar recto al pin del nodo destino
      let endDir: Point | undefined;
      if (i === this.points.length - 2 && this.endNode) {
        endDir = new Point(to.x < this.endNode.position.x ? -1 : 1, 0);
      }

      const segment = WireRouter.route(grid, from, to, startDir, this);

      if (segment.length === 0) continue;

      // Evitar duplicar el punto de unión entre segmentos
      if (i > 0) segment.shift();

      fullPath.push(...segment);
    }

    // Fallback si el enrutamiento falla
    if (fullPath.length === 0) {
      fullPath = [...this.points];
    }

    grid.registerWirePath(this, fullPath);

    fullPath.unshift(this.startPoint);
    fullPath.push(this.endPoint);

    const simplified = WireRouter.simplifyPath(fullPath);
    this.path.length = 0;
    for (const p of simplified) this.path.push(p);

    this.draw();
  }

  // --- MANTENIMIENTO DE CABLES AL MOVER NODOS ---
  public updateLastSegments() {
    if (this.path.length <= 2) return;
    const a = this.path[this.path.length - 2];
    const b = this.path[1];

    if (this.endPoint.y !== a.y) a.y = this.endPoint.y;
    if (this.startPoint.y !== b.y) b.y = this.startPoint.y;

    this.draw();
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

      let p1: Point;
      let p2: Point;

      if (dx > dy) {
        p1 = new Point(midX, a.y);
        p2 = new Point(midX, b.y);
      } else {
        p1 = new Point(a.x, midY);
        p2 = new Point(b.x, midY);
      }
      this.path.splice(i + 1, 0, p1, p2);
      i += 2;
    }
    this.draw();
  }

  public delete(grid?: Grid) {
    if (this.startNode && this.startNode.deleteWire) {
      this.startNode.deleteWire(this.startPin);
    }
    if (this.endNode && this.endNode.deleteWire) {
      this.endNode.deleteWire(this.endPin);
    }
    grid?.unregisterWire(this);
    this.parent?.removeChild(this);
  }

  public getNodes() {
    return [this.startNode, this.endNode];
  }

  draw() {
    this.g.clear();

    // Borde exterior del cable
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

    // Relleno interior del cable
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
      /*    point.x -= cs / 2;
      point.y -= cs / 2; */
      Grid.snapFloor(point);
      point.x += cs / 2;
      point.y += cs / 2;
    }

    this.draw();
  }

  public move(dx: number, dy: number) {
    // Mover los waypoints lógicos
    for (let i = 0; i < this.path.length; i++) {
      const p = this.path[i];
      p.x += dx;
      p.y += dy;
    }
    const grid = this.context.provider.get("grid")!;
    // Actualizar registro en grilla al trasladarlo completo
    if (grid) {
      grid.unregisterWire(this);
      grid.registerWirePath(this, this.path);
    }
    this.draw();
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
