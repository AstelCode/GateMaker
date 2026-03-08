import { Graphics } from "pixi.js";
import {
  BoxCollider,
  Vector,
  type EngineMouseEvent,
  type TextureGenerator,
} from "../../core";
import { NodeRegister } from "../../NodeRegister";
import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
  type NodeDesign,
} from "../NodeEntity";
const { LEFT } = ConnectorDirection;
const { INPUT } = ConnectorType;
export class LedNode extends NodeEntity {
  static name: string = "LED";
  static config: NodeConfig = {
    showConnectorLabel: false,
    showLabel: false,
    nodeName: "LED",
    type: NodeType.OUTPUT,
    colSpan: 1,
    rowSpan: 1,
    connectors: {
      A: { direction: LEFT, idx: 0, type: INPUT },
    },
  };
  static design: NodeDesign = {
    ...NodeEntity.design,
    tolerance: 0,
  };
  static loadTextures(): TextureGenerator[] {
    const func = super.loadTextures()[0];

    const newFunc = () => {
      const result = func();
      const g = new Graphics();
      g.clear();
      g.roundRect(-15, -15, 30, 30, 6);
      g.fill({ color: "#FF9090" });
      g.roundRect(-15, -15, 30, 30, 6);
      g.stroke({ color: "#585858", width: 2 });
      result.container.addChild(g);
      return result;
    };

    return [newFunc];
  }

  graphis: Graphics;
  active: boolean = false;
  constructor() {
    super();
    this.name = "LED";
    this.config = LedNode.config;
    this.design = LedNode.design;
    this.graphis = new Graphics();
    this.graphis.zIndex = 10;
    this.addChild(this.graphis);
  }

  drawControl() {
    this.graphis.clear();
    this.graphis.roundRect(-15, -15, 30, 30, 6);
    this.graphis.fill({ color: this.active ? "#FF9090" : "#ffffff" });
    /*     if (this.active) {
      this.graphis.roundRect(5, -15, 10, 30, 6);
      this.graphis.fill({ color: "#000000" });
    } else {
      this.graphis.roundRect(-15, -15, 10, 30, 6);

      this.graphis.fill({ color: "#000000" });
    } */
    this.graphis.roundRect(-15, -15, 30, 30, 6);
    this.graphis.stroke({ color: "#585858", width: 2 });
  }

  protected onInit(): void {
    super.onInit();
    this.interactionBox = new BoxCollider(20, 20);
    this.drawControl();
    this.forceLayoutUpdate();
  }
  private prevValue: number = 0;
  public update(_delta: number): void {
    if (this.inputsId["A"] == undefined) return;
    const value = this.context.simulator.memory.get(this.inputsId["A"]);
    if (this.prevValue != value) {
      if (value) {
        this.active = true;
      } else {
        this.active = false;
      }
      this.drawControl();
      this.prevValue = value;
    }
  }

  protected onMouseDown(e: EngineMouseEvent): boolean | void {}
}
NodeRegister.registerNode(LedNode);
