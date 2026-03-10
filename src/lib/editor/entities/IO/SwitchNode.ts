import { Graphics } from "pixi.js";
import { BoxCollider, type TextureGenerator } from "../../core";
import { NodeRegister } from "../NodeRegister";
import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
  type NodeDesign,
} from "../NodeEntity";
const { RIGHT } = ConnectorDirection;
const { OUTPUT } = ConnectorType;
export class SwitchNode extends NodeEntity {
  static name: string = "SWITCH";
  static config: NodeConfig = {
    showConnectorLabel: false,
    showLabel: false,
    nodeName: "SWITCH",
    type: NodeType.INPUT,
    colSpan: 1,
    rowSpan: 1,
    connectors: {
      A: { direction: RIGHT, idx: 0, type: OUTPUT, size: 1, address: 0 },
    },
  };
  static design: NodeDesign = {
    ...NodeEntity.design,
    tolerance: 0,
  };

  graphis: Graphics;
  active: boolean = false;

  static loadTextures(): TextureGenerator[] {
    const func = super.loadTextures()[0];

    const newFunc = () => {
      const result = func();
      const g = new Graphics();
      g.clear();
      g.roundRect(-15, -15, 30, 30, 6);
      g.fill({ color: "#FF9090" });
      g.roundRect(5, -15, 10, 30, 6);
      g.fill({ color: "#000000" });
      result.container.addChild(g);
      g.roundRect(-15, -15, 30, 30, 6);
      g.stroke({ color: "#585858", width: 2 });
      return result;
    };

    return [newFunc];
  }

  constructor() {
    super();
    this.name = "SWITCH";
    this.config = SwitchNode.config;
    this.design = SwitchNode.design;
    this.graphis = new Graphics();
    this.graphis.zIndex = 10;
    this.addChild(this.graphis);
  }

  drawControl() {
    this.graphis.clear();
    this.graphis.roundRect(-15, -15, 30, 30, 6);
    this.graphis.fill({ color: this.active ? "#FF9090" : "#ffffff" });
    if (this.active) {
      this.graphis.roundRect(5, -15, 10, 30, 6);
      this.graphis.fill({ color: "#000000" });
    } else {
      this.graphis.roundRect(-15, -15, 10, 30, 6);

      this.graphis.fill({ color: "#000000" });
    }
    this.graphis.roundRect(-15, -15, 30, 30, 6);
    this.graphis.stroke({ color: "#585858", width: 2 });
  }

  protected onInit(): void {
    super.onInit();
    this.interactionBox = new BoxCollider(20, 20);
    this.drawControl();
    this.forceLayoutUpdate();
  }

  protected onMouseDown(): boolean | void {
    if (this.selected) return;
    if (!this.context.simulator.started) return;
    this.active = !this.active;
    if (this.active) {
      this.context.simulator.memory.set(this.outputsAddress["A"], 1);
    } else {
      this.context.simulator.memory.set(this.outputsAddress["A"], 0);
    }
    this.drawControl();
    return true;
  }
}
NodeRegister.registerNode(SwitchNode);
