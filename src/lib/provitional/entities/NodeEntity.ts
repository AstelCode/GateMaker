import { Container, Graphics, Point, Rectangle, Sprite } from "pixi.js";
import { Entity, type Context, type TextureData } from "../core";
import { Grid } from "./Grid";
import { createText } from "../provitional/utils";
import type { Wire } from "./Wire";
import type { AppEvents, AppProviders } from "../provitional/App";

export enum ConnectorDirection {
  LEFT = 1 << 0,
  RIGHT = 1 << 1,
  TOP = 1 << 2,
  BOTTOM = 1 << 3,
  HORIZOTAL = 12,
  VERTICAL = 3,
}

export enum ConnectorType {
  INPUT,
  OUTPUT,
}

export enum NodeType {
  INPUT,
  OUTPUT,
  NODE,
}

export type Connector = {
  direction: ConnectorDirection;
  idx: number;
  type: ConnectorType;
};

export interface NodeConfig {
  nodeName: string;
  colSpan: number;
  rowSpan: number;
  showLabel: boolean;
  connectors: Record<string, Connector>;
  showConnectorLabel: boolean;
  type: NodeType;
}

export class NodeEntity extends Entity {
  static NAME: string = "AND";

  static readonly DESIGN = {
    cw: Grid.CELL_SIZE / 2,
    ch: 10,
    margin: Grid.CELL_SIZE / 4,
    radius: 8,
    labelOffset: 22,
    tolerance: 20,
  };

  static CONFIG?: NodeConfig = {
    showLabel: true,
    colSpan: 3,
    rowSpan: 4,
    connectors: {
      A: {
        direction: ConnectorDirection.TOP,
        idx: 0,
        type: ConnectorType.INPUT,
      },
      B: {
        direction: ConnectorDirection.LEFT,
        idx: 2,
        type: ConnectorType.INPUT,
      },
      C: {
        direction: ConnectorDirection.RIGHT,
        idx: 1,
        type: ConnectorType.OUTPUT,
      },
      D: {
        direction: ConnectorDirection.BOTTOM,
        idx: 1,
        type: ConnectorType.OUTPUT,
      },
    },
    nodeName: "AND",
    showConnectorLabel: true,
    type: NodeType.NODE,
  };

  static createTexture(): TextureData {
    // ... [Se mantiene exactamente igual tu código de createTexture]
    const container = new Container();
    const g = new Graphics();
    container.addChild(g);

    const cs = Grid.CELL_SIZE;
    const { rowSpan, colSpan, showConnectorLabel, showLabel } = this.CONFIG!;
    const { cw, ch, margin, radius, labelOffset } = this.DESIGN;

    const nW = cs * colSpan;
    const nH = cs * rowSpan;

    const w = nW + margin * 2;
    const h = nH + margin * 2;

    const cx = w / 2;
    const cy = h / 2;

    g.roundRect(-nW / 2, -nH / 2, nW, nH, radius);
    g.fill({ color: 0xdddddd });
    g.roundRect(-nW / 2 + 2, -nH / 2 + 2, nW - 4, nH - 4, radius);
    g.stroke({ width: 3, color: 0x000000 });

    const { RIGHT, LEFT, HORIZOTAL, VERTICAL, TOP, BOTTOM } =
      ConnectorDirection;

    for (const key in this.CONFIG!.connectors) {
      const connector = this.CONFIG!.connectors[key];
      const dir = connector.direction;

      const pinPos =
        dir & HORIZOTAL
          ? new Point(cs * connector.idx - cx + margin + cs / 2 - cw / 2, 0)
          : new Point(0, cs * connector.idx - cy + margin + cs / 2 - cw / 2);

      const d = new Point(
        (dir & LEFT ? -nW / 2 - margin / 2 - ch / 2 : 0) +
          (dir & RIGHT ? nW / 2 + margin / 2 - ch / 2 : 0),
        (dir & TOP ? -nH / 2 - margin / 2 - ch / 2 : 0) +
          (dir & BOTTOM ? nH / 2 + margin / 2 - ch / 2 : 0),
      );

      pinPos.x += d.x;
      pinPos.y += d.y;

      if (showConnectorLabel) {
        const label = createText(key, 18, 0x000000);
        label.x = pinPos.x;
        label.y = pinPos.y;

        if (dir & HORIZOTAL) {
          label.x += cw / 2;
          if (dir & TOP) label.y += labelOffset + ch / 2;
          if (dir & BOTTOM) label.y -= labelOffset - ch / 2;
        }

        if (dir & VERTICAL) {
          label.y += cw / 2;
          if (dir & LEFT) label.x += labelOffset + ch / 2;
          if (dir & RIGHT) label.x -= labelOffset - ch / 2;
        }
        container.addChild(label);
      }

      if (dir & VERTICAL) {
        g.roundRect(pinPos.x, pinPos.y, ch, cw, 3);
        g.fill({ color: 0x000000 });
      } else {
        g.roundRect(pinPos.x, pinPos.y, cw, ch, 3);
        g.fill({ color: 0x000000 });
      }
    }

    if (showLabel) {
      const label = createText(this.NAME, 24, 0x000000);
      label.x = 0;
      label.y = 0;
      container.addChild(label);
    }

    const frame = new Rectangle(-w / 2, -h / 2, w, h);
    return { container, frame, resolution: 3 };
  }

  name: string = "";
  sprite!: Sprite;
  config: NodeConfig;

  public _cells: number[] = [];
  public _lastCol?: number;
  public _lastRow?: number;
  private context!: Context<AppProviders, AppEvents>;

  protected wires: Record<string, { wire: Wire; pos: Point }[]> = {};

  constructor() {
    super();
    this.config = NodeEntity.CONFIG!;
    this.zIndex = 2;
  }

  // ... [getConnectorPos, getSelectionBounds, testHit se mantienen igual] ...
  public testHit(p: Point) {
    const { rowSpan, colSpan } = this.config!;
    const { cw, tolerance, margin, ch } = NodeEntity.DESIGN;
    const cs = Grid.CELL_SIZE;
    const centerX = this.position.x - this.pivot.x;
    const centerY = this.position.y - this.pivot.y;

    const dx = p.x - centerX;
    const dy = p.y - centerY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const halfW = (colSpan * cs) / 2;
    const halfH = (rowSpan * cs) / 2;

    const getIdx = (value: number, maxIdx: number) => {
      let idx = Math.round(value / cw);
      if (idx % 2 == 0) return -1;
      idx = (idx - 1) / 2;
      if (idx < 0 || idx >= maxIdx) return -1;
      return idx;
    };

    if (absDx <= halfW - tolerance && absDy <= halfH - tolerance) {
      return { type: "box", x: centerX, y: centerY };
    }
    const { RIGHT, LEFT, TOP, BOTTOM } = ConnectorDirection;
    let direction: ConnectorDirection | null = null;
    let idx = -1;
    if (absDy > halfH - tolerance) {
      direction = dy < 0 ? TOP : BOTTOM;
      idx = getIdx(dx + halfW, this.config.colSpan);
    } else if (absDx > halfW - tolerance) {
      direction = dx < 0 ? LEFT : RIGHT;
      idx = getIdx(dy + halfH, this.config.rowSpan);
    }
    if (direction && idx >= 0) {
      for (const key in this.config.connectors) {
        const conn = this.config.connectors[key];
        if (conn.direction === direction && conn.idx === idx) {
          let cx = centerX;
          let cy = centerY;
          if (direction === TOP) {
            cy -= halfH + margin - ch / 2 + 2;
            cx = centerX - halfW + idx * cs + cs / 2;
          } else if (direction === BOTTOM) {
            cy += halfH + margin - ch / 2 + 2;
            cx = centerX - halfW + idx * cs + cs / 2;
          } else if (direction === LEFT) {
            cx -= halfW + margin - ch / 2 + 2;
            cy = centerY - halfH + idx * cs + cs / 2;
          } else if (direction === RIGHT) {
            cx += halfW + margin - ch / 2 + 2;
            cy = centerY - halfH + idx * cs + cs / 2;
          }

          return {
            type: "connector",
            x: cx,
            y: cy,
            name: key,
            connectorType: conn.type,
          };
        }
      }
    }
    return undefined;
  }

  public getConnectorPos(name: string) {
    const { rowSpan, colSpan } = this.config!;
    const { margin, ch } = NodeEntity.DESIGN;
    const centerX = this.position.x;
    const centerY = this.position.y;
    const { direction, idx } = this.config.connectors[name];
    const { RIGHT, LEFT, TOP, BOTTOM } = ConnectorDirection;
    const cs = Grid.CELL_SIZE;

    const halfW = (colSpan * cs) / 2;
    const halfH = (rowSpan * cs) / 2;
    let cx = centerX;
    let cy = centerY;
    if (direction === TOP) {
      cy -= halfH + margin - ch / 2 + 2;
      cx = centerX - halfW + idx * cs + cs / 2;
    } else if (direction === BOTTOM) {
      cy += halfH + margin - ch / 2 + 2;
      cx = centerX - halfW + idx * cs + cs / 2;
    } else if (direction === LEFT) {
      cx -= halfW + margin - ch / 2 + 2;
      cy = centerY - halfH + idx * cs + cs / 2;
    } else if (direction === RIGHT) {
      cx += halfW + margin - ch / 2 + 2;
      cy = centerY - halfH + idx * cs + cs / 2;
    }
    return { x: cx, y: cy };
  }

  public getSelectionBounds() {
    const cs = Grid.CELL_SIZE;
    const { margin } = NodeEntity.DESIGN;
    const halfW = (this.config.colSpan * cs) / 2;
    const halfH = (this.config.rowSpan * cs) / 2;

    return {
      minX: this.position.x - halfW - margin,
      minY: this.position.y - halfH - margin,
      maxX: this.position.x + halfW + margin,
      maxY: this.position.y + halfH + margin,
    };
  }

  public setWirePos(name: string, wire: Wire, pos: Point) {
    this.wires[name] ??= [];
    this.wires[name].push({ wire, pos });
  }

  public deleteWire(pinName: string) {
    delete this.wires[pinName];
  }

  // --- NUEVO: Desregistra el nodo del Grid antes de eliminar ---
  public delete() {
    const connectedWires = this.getConnectedWires();
    for (const wire of connectedWires) {
      wire.delete();
    }
    const grid = this.context.provider.get("grid") as Grid;
    if (grid) grid.unregisterEntity(this);

    this.parent?.removeChild(this);
  }

  public getConnectedWires() {
    const wires: Wire[] = [];
    for (const item in this.wires) {
      wires.push(...this.wires[item].map((item) => item.wire));
    }
    return wires;
  }

  public getNextNodes() {
    const connectors = Object.entries(this.config.connectors);
    const nodes: NodeEntity[] = [];
    for (let i = 0; i < connectors.length; i++) {
      const [name, { type }] = connectors[i];
      if (
        type == ConnectorType.OUTPUT &&
        this.wires[name] &&
        this.wires[name].length > 0
      ) {
        this.wires[name].forEach((item) => {
          if (item.wire.startNode == this) nodes.push(item.wire.endNode);
          else nodes.push(item.wire.startNode);
        });
      }
    }
    return nodes;
  }

  public isValidConnector(name: string) {
    if (!this.wires[name]) return true;
    return this.wires[name].length == 0;
  }

  // --- NUEVO: Guardamos el contexto y registramos el nodo en el Grid ---
  protected onInit(context: Context<AppProviders, AppEvents>): void {
    this.context = context;
    this.sprite = new Sprite(context.assets.get("AND"));
    this.sprite.anchor.set(0.5);
    const cs = Grid.CELL_SIZE;
    //this.pivot.set(
    //  this.config.colSpan % 2 == 1 ? cs / 2 : 0,
    //  this.config.rowSpan % 2 == 1 ? cs / 2 : 0,
    //);
    this.position.x += this.config.colSpan % 2 == 1 ? cs / 2 : 0;
    this.position.y += this.config.rowSpan % 2 == 1 ? cs / 2 : 0;

    this.addChild(this.sprite);

    // Registrar la posición inicial en el Grid
    const grid = this.context.provider.get("grid")!;
    if (grid) grid.registerEntity(this);
  }

  updateWires() {
    for (const name in this.wires) {
      const pos = this.getConnectorPos(name);
      this.wires[name].forEach((item) => {
        item.pos.x = pos.x;
        item.pos.y = pos.y;
        item.wire.draw(); // Solo dibujamos mientras arrastramos
      });
    }
  }

  snapPos() {
    const cs = Grid.CELL_SIZE;
    Grid.snapRound(this.position);
    this.position.x += this.config.colSpan % 2 == 1 ? cs / 2 : 0;
    this.position.y += this.config.rowSpan % 2 == 1 ? cs / 2 : 0;
    const grid = this.context.provider.get("grid") as Grid;
    if (grid) grid.registerEntity(this);
  }
}
