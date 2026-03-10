import { Graphics, Text } from "pixi.js";
import { createText, type TextureGenerator } from "../../core";
import { NodeRegister } from "../../NodeRegister";
import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
} from "../NodeEntity";
const { RIGHT } = ConnectorDirection;
const { OUTPUT } = ConnectorType;

export class OutputNode extends NodeEntity {
  static name: string = "OUTPUT";
  static config: NodeConfig = {
    showConnectorLabel: false,
    showLabel: false,
    nodeName: "OUTPUT",
    type: NodeType.OUTPUT,
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
      result.container.addChild(createText("OUTPUT", 16, 0x000000, true));
      return result;
    };

    return [newFunc];
  }
  graphis: Graphics;
  text: Text;
  label: string = "";
  constructor() {
    super();
    this.name = "OUTPUT";
    this.config = OutputNode.config;
    this.design = OutputNode.design;
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
  public getName() {
    return this.text.text;
  }

  public drawText() {
    this.graphis.clear();
    this.graphis.rect(-60, -20, 90, 30);
    this.graphis.fill({ color: 0xdddddd });
  }
}

NodeRegister.registerNode(OutputNode);
