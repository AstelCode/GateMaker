import { Graphics, Point, Rectangle, TilingSprite } from "pixi.js";
import type { Context, Entity } from "../core";
import { fastFloor } from "../provitional/utils";
// NOTA: Asegúrate de importar o crear hashPos en tus utils.
import { hashPos } from "../provitional/utils";
import type { NodeEntity } from "./NodeEntity";
import type { Wire } from "./Wire";

export class Grid {
  static CELL_SIZE: number = 50;
  sprite!: TilingSprite;

  // --- NUEVO: Memoria Espacial ---
  memory: Map<string, Entity[]> = new Map();
  wireMemory: Map<string, Set<Wire>> = new Map();

  createTexture(context: Context<any, any>) {
    const g = new Graphics();
    const cs = Grid.CELL_SIZE;
    const radius = 4;
    const color = 0xc0c0c0;

    g.beginPath();
    g.setFillStyle({ color });
    g.arc(cs / 2, cs / 2, radius, 0, Math.PI * 2);
    g.fill();

    const texture = context.app.renderer.generateTexture({
      target: g,
      frame: new Rectangle(0, 0, Grid.CELL_SIZE, Grid.CELL_SIZE),
      resolution: 3,
    });

    g.destroy();
    context.assets.registerTexture("GRID", texture);
  }

  init(context: Context<any, any>) {
    const texture = context.assets.get("GRID");
    if (!texture) {
      console.error("¡La textura GRID no fue registrada!");
      return;
    }

    this.sprite = new TilingSprite({
      texture: texture,
      width: 2000,
      height: 2000,
    });
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.zIndex = -1;
  }

  getSprite() {
    return this.sprite;
  }

  registerEntity(e: NodeEntity) {
    const inv = 1 / Grid.CELL_SIZE;
    const baseCol = fastFloor(e.position.x * inv);
    const baseRow = fastFloor(e.position.y * inv);
    console.log(baseCol, baseRow);

    // Ajustamos la cuadrícula central según la nueva configuración
    const startCol =
      baseCol -
      (e.config.colSpan % 2 == 0
        ? e.config.colSpan / 2
        : (e.config.colSpan - 1) / 2);
    const startRow =
      baseRow -
      (e.config.rowSpan % 2 == 0
        ? e.config.rowSpan / 2
        : (e.config.rowSpan - 1) / 2);

    // Si tu NodeEntity no tiene estas propiedades, puedes añadirlas para evitar recálculos:
    if ((e as any)._lastCol === baseCol && (e as any)._lastRow === baseRow)
      return;

    this.unregisterEntity(e);

    (e as any)._cells = [];
    (e as any)._lastCol = baseCol;
    (e as any)._lastRow = baseRow;

    for (let i = 0; i < e.config.colSpan; i++) {
      for (let j = 0; j < e.config.rowSpan; j++) {
        const col = startCol + i;
        const row = startRow + j;
        const key = hashPos(col, row);

        let cell = this.memory.get(key);
        if (!cell) {
          cell = [];
          this.memory.set(key, cell);
        }

        cell.push(e);
        (e as any)._cells.push(key);
      }
    }
  }

  unregisterEntity(e: NodeEntity) {
    const cells = (e as any)._cells;
    if (!cells) return;

    for (const key of cells) {
      const cell = this.memory.get(key);
      if (!cell) continue;

      const idx = cell.indexOf(e);
      if (idx !== -1) cell.splice(idx, 1);

      if (cell.length === 0) this.memory.delete(key);
    }
    cells.length = 0;
  }

  registerWirePath(wire: Wire, path: Point[]) {
    this.unregisterWire(wire);

    for (const p of path) {
      const { x: col, y: row } = this.worldToGrid(p);
      const key = hashPos(col, row);

      let cellWires = this.wireMemory.get(key);
      if (!cellWires) {
        cellWires = new Set();
        this.wireMemory.set(key, cellWires);
      }
      cellWires.add(wire);

      (wire as any)._cells = (wire as any)._cells || [];
      (wire as any)._cells.push(key);
    }
  }

  unregisterWire(wire: Wire) {
    const cells = (wire as any)._cells;
    if (!cells) return;
    for (const key of cells) {
      const cellWires = this.wireMemory.get(key);
      if (cellWires) {
        cellWires.delete(wire);
        if (cellWires.size === 0) this.wireMemory.delete(key);
      }
    }
    cells.length = 0;
  }

  isWalkable(col: number, row: number): boolean {
    const key = hashPos(col, row);
    const cell = this.memory.get(key);
    return !cell || cell.length === 0;
  }

  getCellCost(col: number, row: number, currentWire?: Wire): number {
    if (!this.isWalkable(col, row)) return Infinity;

    let cost = 10; // COSTO BASE

    // Padding: Evitar rozar los nodos sumando costo
    const paddingDirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of paddingDirs) {
      if (!this.isWalkable(col + dx, row + dy)) {
        cost += 5;
        break;
      }
    }

    // Costo extra por cruzarse con otros cables
    const key = hashPos(col, row);
    const wiresInCell = this.wireMemory.get(key);
    if (wiresInCell && wiresInCell.size > 0) {
      if (
        !currentWire ||
        !wiresInCell.has(currentWire) ||
        wiresInCell.size > 1
      ) {
        cost += 50;
      }
    }

    return cost;
  }

  worldToGrid(p: { x: number; y: number }) {
    const inv = 1 / Grid.CELL_SIZE;
    return {
      x: fastFloor(p.x * inv),
      y: fastFloor(p.y * inv),
    };
  }

  gridToWorld(x: number, y: number): Point {
    const s = Grid.CELL_SIZE;
    return new Point(x * s + s / 2, y * s + s / 2);
  }

  // --- UTILIDADES ESTÁTICAS DE SNAP ---
  static snapRound(p: { x: number; y: number }) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    p.x = Math.round(p.x * inv) * s;
    p.y = Math.round(p.y * inv) * s;
  }

  static snapRoundValue(x: number) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    return Math.round(x * inv) * s;
  }

  static snapFloor(p: { x: number; y: number }) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    p.x = fastFloor(p.x * inv) * s;
    p.y = fastFloor(p.y * inv) * s;
  }

  static snapFloorValue(x: number) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    return fastFloor(x * inv) * s;
  }
}
