import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
  type NodeJson,
} from "../NodeEntity";
import { createText, type TextureGenerator } from "../../core";
import { Graphics, Text } from "pixi.js";
import { NodeRegister } from "../NodeRegister";
const { RIGHT } = ConnectorDirection;
const { OUTPUT } = ConnectorType;

export interface InputJson extends NodeJson {
  size: number;
}
export class InputNode extends NodeEntity {
  static name: string = "INPUT";
  static config: NodeConfig = {
    showConnectorLabel: false,
    showLabel: false,
    nodeName: "INPUT",
    type: NodeType.INPUT,
    colSpan: 3,
    rowSpan: 1,
    connectors: {
      A: { direction: RIGHT, idx: 0, type: OUTPUT, size: 1, address: 0 },
    },
  };

  static loadTextures(): TextureGenerator[] {
    const func = super.loadTextures()[0];

    const newFunc = () => {
      const result = func();
      result.container.addChild(createText("INPUT", 16, 0x000000, true));
      return result;
    };

    return [newFunc];
  }
  graphis: Graphics;
  text: Text;
  constructor() {
    super();
    this.name = "INPUT";
    this.config = {
      showConnectorLabel: false,
      showLabel: false,
      nodeName: "INPUT",
      type: NodeType.INPUT,
      colSpan: 3,
      rowSpan: 1,
      connectors: {
        A: { direction: RIGHT, idx: 0, type: OUTPUT, size: -1, address: 0 },
      },
    };
    this.design = InputNode.design;
    this.graphis = new Graphics();
    this.graphis.zIndex = 5;
    this.addChild(this.graphis);
    this.text = createText("NAME", 18, 0x000000, true);
    this.text.zIndex = 10;
    this.addChild(this.text);
  }

  protected onInit(): void {
    super.onInit();
    this.drawText();
    this.text.text = "NAME";
  }

  public rename(text: string) {
    this.text.text = text;
  }

  public getText() {
    return this.text.text;
  }

  public setConnectorSize(size: number) {
    this.config.connectors["A"].size = size;
  }

  public getConnectorSize() {
    return this.config.connectors["A"].size;
  }

  drawText() {
    this.graphis.clear();
    this.graphis.rect(-60, -20, 90, 30);
    this.graphis.fill({ color: 0xdddddd });
  }
  public toJson(): InputJson {
    return {
      ...super.toJson(),
      size: this.getConnectorSize(),
    };
  }
}

NodeRegister.registerNode(InputNode);
