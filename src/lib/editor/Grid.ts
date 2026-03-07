import { Container, Graphics, Rectangle, TilingSprite } from "pixi.js";
import {
  Entity,
  Vector,
  type EngineContext,
  type TextureData,
  type TextureGenerator,
  type VectorData,
} from "./core";
import type { AppContext, AppEvents, AppProviders } from "./App";
import { fastFloor, hashPos } from "./utils";
import type { NodeEntity } from "./entities/NodeEntity";
import type { Wire } from "./entities/Wire";

function createTexture(): TextureGenerator[] {
  const generator: TextureGenerator = () => {
    const container = new Container();
    const g = new Graphics();
    container.addChild(g);

    const cs = Grid.cellSize;
    const color = 0xdde3ee;

    g.beginPath();
    g.arc(cs / 2, cs / 2, 5, 0, Math.PI * 2);
    g.fill({ color });

    return {
      name: "GRID",
      container,
      resolution: 5,
      frame: new Rectangle(0, 0, cs, cs),
    };
  };

  return [generator];
}

type GridItem = NodeEntity | Wire;
export class Grid {
  static cellSize: number = 50;
  public sprite!: TilingSprite;

  //#region design
  static loadTextures() {
    return createTexture();
  }

  public init(context: EngineContext<AppProviders, AppEvents, AppContext>) {
    const texture = context.assets.get("GRID").texture;
    const dpr = window.devicePixelRatio || 1;
    if (!texture) {
      console.error("¡La textura GRID no fue registrada!");
      return;
    }
    this.sprite = new TilingSprite({
      texture: texture,
      width: 2000 * dpr,
      height: 2000 * dpr,
    });
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.zIndex = -1;
    this.setPosition(0, 0);
  }

  public setPosition(x: number, y: number) {
    this.sprite.tilePosition.x = x;
    this.sprite.tilePosition.y = y;
  }

  public resize(width: number, height: number) {
    if (this.sprite) {
      this.sprite.width = width;
      this.sprite.height = height;
    }
  }

  //#endregion

  //#region static methods
  static worldToGrid(p: Vector) {
    const inv = 1 / Grid.cellSize;
    return {
      x: fastFloor(p.x * inv),
      y: fastFloor(p.y * inv),
    };
  }

  static snap(p: VectorData) {
    const s = this.cellSize;
    const inv = 1 / this.cellSize;

    const gx = fastFloor(p.x * inv);
    const gy = fastFloor(p.y * inv);

    p.x = gx * s;
    p.y = gy * s;
  }

  //#endregion

  //#region grid controller
  memory: Map<number, GridItem[]> = new Map();
  wireMemory: Map<number, Set<Wire>> = new Map();

  public pointToGrid(point: Vector) {
    const cs = Grid.cellSize;
    return new Vector(Math.floor(point.x / cs), Math.floor(point.y / cs));
  }

  public registerEntity(e: NodeEntity) {
    const inv = 1 / Grid.cellSize;
    const baseCol = fastFloor(e.position.x * inv);
    const baseRow = fastFloor(e.position.y * inv);

    const { colSpan, rowSpan } = e.config;

    const startCol =
      baseCol - (colSpan % 2 == 0 ? colSpan / 2 : (colSpan - 1) / 2);

    const startRow =
      baseRow - (rowSpan % 2 == 0 ? rowSpan / 2 : (rowSpan - 1) / 2);

    if (e._lastCol === baseCol && e._lastRow === baseRow) return;

    this.unregisterEntity(e);

    e._cells.length = 0;
    e._lastCol = baseCol;
    e._lastRow = baseRow;

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

        cell.push(e as NodeEntity);
        e._cells.push(key);
      }
    }
  }

  public unregisterEntity(e: NodeEntity) {
    for (const key of e._cells) {
      const cell = this.memory.get(key);
      if (!cell) continue;

      const idx = cell.indexOf(e);
      if (idx !== -1) cell.splice(idx, 1);

      if (cell.length === 0) this.memory.delete(key);
    }
    e._cells.length = 0;
  }

  public getCellCost(col: number, row: number, currentWire?: Wire): number {
    if (!this.isWalkable(col, row)) return Infinity;

    let cost = 10; // BASE_COST

    // Padding suave: +5 de costo por estar tocando el perímetro de un nodo
    const paddingDirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of paddingDirs) {
      if (!this.isWalkable(col + dx, row + dy)) {
        cost += 5;
        break; // Solo multar una vez
      }
    }

    // Costo por cruzar otro cable
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

  public queryPoint(x: number, y: number): GridItem[] {
    const inv = 1 / Grid.cellSize;
    const col = fastFloor(x * inv);
    const row = fastFloor(y * inv);
    const key = hashPos(col, row);
    return this.memory.get(key) ?? [];
  }

  public queryRect(x: number, y: number, w: number, h: number): GridItem[] {
    const inv = 1 / Grid.cellSize;

    const minCol = fastFloor(x * inv);
    const minRow = fastFloor(y * inv);
    const maxCol = fastFloor((x + w) * inv);
    const maxRow = fastFloor((y + h) * inv);

    const result = new Set<GridItem>();

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const cell = this.memory.get(hashPos(col, row));
        if (!cell) continue;
        for (const e of cell) result.add(e);
      }
    }

    return [...result];
  }

  public isOccupied(e: NodeEntity): boolean {
    const inv = 1 / Grid.cellSize;
    const baseCol = fastFloor(e.position.x * inv);
    const baseRow = fastFloor(e.position.y * inv);

    const halfCol = (e.config.colSpan - 1) >> 1;
    const halfRow = (e.config.rowSpan - 1) >> 1;

    for (let i = -halfCol; i <= halfCol; i++) {
      for (let j = -halfRow; j <= halfRow; j++) {
        const col = baseCol + i;
        const row = baseRow + j;
        const key = hashPos(col, row);
        const cell = this.memory.get(key);
        if (!cell) continue;
        for (const other of cell) {
          if (other !== e) return true;
        }
      }
    }

    return false;
  }

  public registerWirePath(wire: Wire, path: Vector[]) {
    this.unregisterWire(wire);

    for (const p of path) {
      const { x: col, y: row } = Grid.worldToGrid(p);
      const key = hashPos(col, row);

      let cellWires = this.wireMemory.get(key);
      if (!cellWires) {
        cellWires = new Set();
        this.wireMemory.set(key, cellWires);
      }
      cellWires.add(wire);
      wire._cells = wire._cells || [];
      wire._cells.push(key);
    }
  }

  public unregisterWire(wire: Wire) {
    if (!wire._cells) return;
    for (const key of wire._cells) {
      const cellWires = this.wireMemory.get(key);
      if (cellWires) {
        cellWires.delete(wire);
        if (cellWires.size === 0) this.wireMemory.delete(key);
      }
    }
    wire._cells.length = 0;
  }

  public isWalkable(col: number, row: number): boolean {
    const key = hashPos(col, row);
    const cell = this.memory.get(key);
    return !cell || cell.length === 0;
  }
  static gridToWorld(x: number, y: number) {
    const s = Grid.cellSize;
    return new Vector(x * s + s / 2, y * s + s / 2);
  }
  //#endregion
}
