import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
} from "../NodeEntity";
import { createText, type TextureGenerator } from "../../core";
import { NodeRegister } from "../../NodeRegister";
import { Graphics, Text } from "pixi.js";

const { LEFT } = ConnectorDirection;
const { INPUT } = ConnectorType;

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
      A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
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
    this.config = InputNode.config;
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

  public getName() {
    return this.text.text;
  }

  drawText() {
    this.graphis.clear();
    this.graphis.rect(-60, -20, 90, 30);
    this.graphis.fill({ color: 0xdddddd });
  }
}

NodeRegister.registerNode(InputNode);
