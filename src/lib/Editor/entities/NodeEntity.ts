import { Rectangle, Sprite, type Graphics, Text } from "pixi.js";
import {
  Entity,
  type Context,
  type DefaultEvents,
  type DefaultProvider,
} from "../core";
import { Grid } from "./Grid";
export type NodeDirection = "left" | "top" | "right" | "bottom";

export enum ConnectorType {
  INPUT,
  OUTPUT,
}

export enum NodeType {
  INPUT,
  OUTPUT,
  NODE,
}

export type NodeConnector = {
  name: string;
  direction: NodeDirection;
  idx: number;
  type: ConnectorType;
};

export interface NodeConfig {
  nodeName: string;
  colSpan: number;
  rowSpan: number;
  showLabel: boolean;
  connectors: NodeConnector[];
  showConnectorLabel: boolean;
  type: NodeType;
}

export class NodeEntity extends Entity {
  static NAME: string = "AND";

  static createTexture(g: Graphics): Rectangle {
    const cs = Grid.CELL_SIZE;
    const radius = 8;
    const height = cs * 3;
    const width = cs * 3;
    g.roundRect(0, 0, width, height, radius);
    g.fill({ color: 0xdddddd });

    g.roundRect(2, 2, width - 4, height - 4, radius);
    g.stroke({ width: 2, color: 0x000000 });

    const label = new Text({
      text: NodeEntity.NAME,
      style: {
        fontFamily: "Arial",
        fontSize: 25,
        fill: 0x000000,
        fontWeight: "bold",
      },
    });
    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = height / 2;
    g.addChild(label);
    return new Rectangle(0, 0, width, height);
  }

  name: string = "";
  sprite!: Sprite;
  constructor() {
    super();
    this.position.x += Grid.CELL_SIZE / 2;
    this.position.y += Grid.CELL_SIZE / 2;
  }

  protected onUpdate(_delta: number): void {}

  protected onInit(context: Context<DefaultProvider, DefaultEvents>): void {
    this.sprite = new Sprite(context.assets.get("AND"));
    this.addChild(this.sprite);
  }
}
