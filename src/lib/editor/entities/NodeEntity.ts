import { Container, Graphics, Rectangle, Sprite } from "pixi.js";
import {
  BoxCollider,
  createText,
  Entity,
  Vector,
  type EngineMouseEvent,
  type TextureGenerator,
} from "../core";
import { Grid } from "../Grid";
import type { AppContext, AppEvents, AppProviders } from "../App";
import type { Wire } from "./Wire";
import type { Operation } from "./gates/Gate";

export enum ConnectorDirection {
  LEFT = 1 << 0,
  RIGHT = 1 << 1,
  TOP = 1 << 2,
  BOTTOM = 1 << 3,
  VERTICAL = 12,
  HORIZONTAL = 3,
}

export enum ConnectorType {
  INPUT,
  OUTPUT,
}

export type Connector = {
  idx: number;
  direction: ConnectorDirection;
  type: ConnectorType;
  size: number;
  address: number;
};

export enum NodeType {
  INPUT,
  OUTPUT,
  NODE,
}

export interface NodeConfig {
  nodeName: string;
  colSpan: number;
  rowSpan: number;
  showLabel: boolean;
  connectors: Record<string, Connector>;
  showConnectorLabel: boolean;
  type: NodeType;
}

export interface NodeDesign {
  connectorHeight: number;
  connectorWidth: number;
  margin: number;
  radius: number;
  labelOffset: number;
  tolerance: number;
}

export interface NodeJson {
  type: "gate";
  id: string;
  name: string;
  position: Vector;
}
const directionMap: Record<number, Vector> = {
  [ConnectorDirection.LEFT]: new Vector(-1, 0),
  [ConnectorDirection.RIGHT]: new Vector(1, 0),
  [ConnectorDirection.TOP]: new Vector(0, -1),
  [ConnectorDirection.BOTTOM]: new Vector(0, 1),
};

export function createNodeTexture(
  name: string,
  config: NodeConfig,
  design: NodeDesign,
): TextureGenerator[] {
  const func = () => {
    const container = new Container();
    const g = new Graphics();
    container.addChild(g);
    const cs = Grid.cellSize;
    const { rowSpan, colSpan, showConnectorLabel, showLabel } = config;
    const {
      connectorHeight: ch,
      connectorWidth: cw,
      margin,
      radius,
      labelOffset,
    } = design;
    const nW = cs * colSpan;
    const nH = cs * rowSpan;
    const w = nW + margin * 2;
    const h = nH + margin * 2;
    const c = new Vector(w / 2, h / 2);

    g.roundRect(-nW / 2, -nH / 2, nW, nH, radius + 2);
    g.fill({ color: 0xdddddd });
    g.roundRect(-nW / 2 + 2, -nH / 2 + 2, nW - 4, nH - 4, radius);
    g.stroke({ width: 3, color: 0x202845 });

    const {
      RIGHT,
      LEFT,
      VERTICAL: HORIZOTAL,
      HORIZONTAL: VERTICAL,
      TOP,
      BOTTOM,
    } = ConnectorDirection;

    for (const key in config.connectors) {
      const connector = config.connectors[key];
      const dir = connector.direction;
      const v = dir & HORIZOTAL ? new Vector(1, 0) : new Vector(0, 1);
      const v1 = directionMap[connector.direction].clone();
      const p = new Vector(connector.idx * cs)
        .subtract(c)
        .addScalar(margin + cs / 2 - cw / 2)
        .multiply(v);

      const d = v1.multiply(
        new Vector(nW / 2 + margin / 2, nH / 2 + margin / 2),
      );
      if (dir & HORIZOTAL) d.y -= ch / 2;
      else d.x -= ch / 2;

      p.add(d);

      if (showConnectorLabel) {
        const label = createText(key, 18, 0x000000);
        label.x = p.x;
        label.y = p.y;

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
        g.roundRect(p.x, p.y, ch, cw, 3);
        g.fill({ color: 0x000000 });
      } else {
        g.roundRect(p.x, p.y, cw, ch, 3);
        g.fill({ color: 0x000000 });
      }
    }

    if (showLabel) {
      const label = createText(name, 24, 0x000000);
      label.x = 0;
      label.y = 0;
      container.addChild(label);
    }

    const frame = new Rectangle(-w / 2, -h / 2, w, h);

    return {
      name,
      frame,
      resolution: 3,
      container,
    };
  };

  return [func];
}

export class NodeEntity extends Entity<AppProviders, AppEvents, AppContext> {
  static name: string;

  //#region  static methods

  static readonly design: NodeDesign = {
    connectorWidth: Grid.cellSize / 2,
    connectorHeight: 10,
    margin: Grid.cellSize / 4,
    radius: 10,
    labelOffset: 22,
    tolerance: 20,
  };

  static config: NodeConfig;

  static loadTextures(): TextureGenerator[] {
    return createNodeTexture(this.name, this.config!, this.design);
  }

  static adjustPos(node: NodeEntity) {
    const cs = Grid.cellSize;
    node.position.x += node.config.colSpan % 2 == 0 ? cs / 2 : 0;
    node.position.y += node.config.rowSpan % 2 == 0 ? cs / 2 : 0;
    Grid.snap(node.position);
    node.position.x += node.config.colSpan % 2 == 1 ? cs / 2 : 0;
    node.position.y += node.config.rowSpan % 2 == 1 ? cs / 2 : 0;
  }

  //#endregion

  name: string = "";
  sprite!: Sprite;
  connectorGraphics!: Graphics;
  config: NodeConfig;
  design: NodeDesign;

  outputsAddress: Record<string, number>;
  inputsAddress: Record<string, number>;

  public _cells: number[] = [];
  public _lastCol?: number;
  public _lastRow?: number;
  protected wires: Record<string, { wire: Wire; pos: Vector }[]> = {};

  constructor() {
    super();
    this.name = "AND";
    this.config = NodeEntity.config!;
    this.design = NodeEntity.design!;
    this.zIndex = 2;
    this.collider = new BoxCollider(this.width, this.height, new Vector());
    this.outputsAddress = {};
    this.inputsAddress = {};
  }

  protected onInit(): void {
    this.sprite = new Sprite(this.context.assets.get(this.name).texture);
    this.connectorGraphics = new Graphics();
    this.sprite.anchor.set(0.5);
    const cs = Grid.cellSize;
    this.position.x += this.config.colSpan % 2 == 1 ? cs / 2 : 0;
    this.position.y += this.config.rowSpan % 2 == 1 ? cs / 2 : 0;
    this.addChild(this.sprite);
    this.addChild(this.connectorGraphics);
    this.markDirty();
    this.context.grid.registerEntity(this);
    this.createOutputsId();
  }

  protected createOutputsId() {
    for (const name in this.config.connectors) {
      const connector = this.config.connectors[name];
      if (connector.type == ConnectorType.OUTPUT) {
        this.outputsAddress[name] = this.context.simulator.memory.register();
      }
    }
  }

  public testHit(p: Vector) {
    const { rowSpan, colSpan } = this.config!;
    const {
      connectorWidth: cw,
      tolerance,
      margin,
      connectorHeight: ch,
    } = this.design;
    const cs = Grid.cellSize;
    if (!this.position) return undefined;

    const center = new Vector(this.position.x, this.position.y);
    const delta = p.clone().subtract(center);
    const absDx = Math.abs(delta.x);
    const absDy = Math.abs(delta.y);
    const halfW = (colSpan * cs) / 2;
    const halfH = (rowSpan * cs) / 2;

    const getIdx = (value: number, maxIdx: number) => {
      let idx = Math.floor(value / cw);
      if (idx < 0) return -1;
      if (idx % 2 == 1) return -1;
      idx = idx / 2;
      if (idx > maxIdx) return -1;
      return idx;
    };
    if (this.position == undefined) return undefined;

    if (absDx <= halfW - tolerance && absDy <= halfH - tolerance) {
      return { type: "box", x: center.x, y: center.y };
    }
    const { RIGHT, LEFT, TOP, BOTTOM } = ConnectorDirection;
    let direction: ConnectorDirection | null = null;
    let idx = -1;
    if (absDy > halfH - tolerance && absDx < halfW - margin) {
      direction = delta.y < 0 ? TOP : BOTTOM;
      idx = getIdx(delta.x + halfW - (cs - cw) / 2, this.config.colSpan);
    }

    if (absDx > halfW - tolerance && absDy < halfH - margin) {
      direction = delta.x < 0 ? LEFT : RIGHT;
      idx = getIdx(delta.y + halfH - (cs - cw) / 2, this.config.rowSpan);
    }

    if (direction && idx >= 0) {
      for (const key in this.config.connectors) {
        const conn = this.config.connectors[key];
        if (conn.direction === direction && conn.idx === idx) {
          const dirVec = directionMap[direction];
          const edgeCenter = center
            .clone()
            .add(
              dirVec
                .clone()
                .multiply(
                  new Vector(halfW + margin - ch / 2, halfH + margin - ch / 2),
                ),
            );
          const lateral =
            direction === TOP || direction === BOTTOM
              ? new Vector(-halfW + idx * cs + cs / 2, 0)
              : new Vector(0, -halfH + idx * cs + cs / 2);
          const finalPos = edgeCenter.add(lateral);
          return {
            type: "connector",
            x: finalPos.x,
            y: finalPos.y,
            name: key,
            connectorType: conn.type,
            direction,
          };
        }
      }
    }
    if (absDx <= halfW && absDy <= halfH) {
      return { type: "box", x: center.x, y: center.y };
    }
    return undefined;
  }

  public getConnectorInfo(name: string) {
    return this.config.connectors[name];
  }

  public getConnector(name: string) {
    return {
      posititon: this.getConnectorPos(name),
      info: this.config.connectors[name],
    };
  }

  public getConnectorPos(name: string) {
    const { rowSpan, colSpan } = this.config!;
    const { margin, connectorHeight: ch } = this.design;
    const { TOP, BOTTOM } = ConnectorDirection;
    const cs = Grid.cellSize;
    const center = new Vector(this.position.x, this.position.y);
    const halfW = (colSpan * cs) / 2;
    const halfH = (rowSpan * cs) / 2;
    const { direction, idx } = this.config.connectors[name];
    const dirVec = directionMap[direction];
    const edgeCenter = center
      .clone()
      .add(
        dirVec
          .clone()
          .multiply(
            new Vector(halfW + margin - ch / 2, halfH + margin - ch / 2),
          ),
      );
    const lateral =
      direction === TOP || direction === BOTTOM
        ? new Vector(-halfW + idx * cs + cs / 2, 0)
        : new Vector(0, -halfH + idx * cs + cs / 2);
    const finalPos = edgeCenter.add(lateral);
    return new Vector(finalPos.x, finalPos.y);
  }

  public getNextNodes() {
    const connectors = this.config.connectors;
    const nodes: NodeEntity[] = [];
    const memory = new Set<string>();
    for (const name in connectors) {
      const { type } = connectors[name];
      if (
        type == ConnectorType.OUTPUT &&
        this.wires[name] &&
        this.wires[name].length > 0
      ) {
        this.wires[name].forEach((item) => {
          if (item.wire.startNode.node == this) {
            if (!memory.has(item.wire.endNode.node.id)) {
              nodes.push(item.wire.endNode.node);
              memory.add(item.wire.endNode.node.id);
            }
          } else {
            if (!memory.has(item.wire.startNode.node.id)) {
              nodes.push(item.wire.startNode.node);
              memory.add(item.wire.startNode.node.id);
            }
          }
        });
      }
    }
    return nodes;
  }

  public isValidConnector(name: string) {
    if (this.config.connectors[name].type == ConnectorType.OUTPUT) return true;
    if (!this.wires[name]) return true;
    return this.wires[name].length == 0;
  }

  protected updateCollider(): void {
    const { rowSpan, colSpan } = this.config;
    const { margin } = this.design;
    const cs = Grid.cellSize;
    const w = cs * colSpan + margin * 2;
    const h = cs * rowSpan + margin * 2;
    (this.collider as BoxCollider).set(
      w,
      h,
      new Vector(this.position.x, this.position.y),
    );
  }

  public deleteWire(pin: string, wire: Wire) {
    if (!this.wires[pin]) return;
    if (this.config.connectors[pin].type == ConnectorType.INPUT) {
      delete this.inputsAddress[pin];
    }
    this.wires[pin] = this.wires[pin].filter((item) => item.wire != wire);
  }

  public connectWire(name: string, wire: Wire, pos: Vector) {
    this.wires[name] ??= [];
    this.wires[name].push({ wire, pos });
  }

  public delete() {
    Object.values(this.outputsAddress).map((item) => {
      this.context.simulator.memory.delete(item);
    });
    this.getConnectedWires().forEach((wire) => wire.delete());
    this.context.grid.unregisterEntity(this);
    this.destroy();
  }

  public getConnectedWires() {
    const wires: Wire[] = [];
    for (const item in this.wires) {
      wires.push(...this.wires[item].map((item) => item.wire));
    }
    return wires;
  }

  activeConnector?: {
    name: string;
    x: number;
    y: number;
    direction: ConnectorDirection;
  };

  public draw() {
    this.connectorGraphics.clear();
    if (!this.activeConnector) return;
    const { x, y, direction } = this.activeConnector;
    const { connectorWidth: cw, connectorHeight: ch } = this.design;
    const { HORIZONTAL, VERTICAL, LEFT, TOP } = ConnectorDirection;
    if (direction & HORIZONTAL) {
      this.connectorGraphics.roundRect(
        x - this.position.x - ch + (direction & LEFT ? 6 : 4),
        y - this.position.y - cw / 2,
        ch,
        cw,
        3,
      );
    }
    if (direction & VERTICAL) {
      this.connectorGraphics.roundRect(
        x - this.position.x - cw / 2,
        y - this.position.y + (direction & TOP ? -4 : -6),
        cw,
        ch,
        3,
      );
    }
    this.connectorGraphics.fill({ color: "#646484" });
  }

  protected onDirty(): void {
    for (const name in this.wires) {
      const pos = this.getConnectorPos(name);
      this.wires[name].forEach((item) => {
        item.pos.set(pos);
        item.wire.forceLayoutUpdate();
      });
    }
    this.context.grid.registerEntity(this);
  }

  protected onMouseHover(e: EngineMouseEvent): boolean | void {
    console.log(this);
    this.context.mouse.cursor = "pointer";
  }

  protected onMouseMove(e: EngineMouseEvent): boolean | void {
    if (this.selected) return;
    const connector = this.testHit(new Vector(e.wX, e.wY));
    if (!connector) {
      this.activeConnector = undefined;
      this.draw();
      return;
    }
    if (connector?.type == "box") {
      this.activeConnector = undefined;
    }
    this.activeConnector = {
      name: connector.name!,
      x: connector.x!,
      y: connector.y!,
      direction: connector.direction!,
    };
    this.draw();
  }

  protected onMouseLeave(e: EngineMouseEvent): boolean | void {
    this.activeConnector = undefined;
    this.draw();
    this.context.mouse.cursor = "default";
  }

  /*  public getInfo(): {
    type: number;
    output: number[];
    input: number[];
  } {
    return { type: 0, output: [], input: [] };
  } */
  getOperations(): Operation[] {
    return [];
  }

  public toJson(): NodeJson {
    return {
      type: "gate",
      id: this.id,
      name: this.config.nodeName,
      position: new Vector(this.position),
    };
  }
}
