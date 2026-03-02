import { Point } from "pixi.js";
import {
  Engine,
  Entity,
  Log,
  MouseButton,
  MouseEventType,
  type DefaultEvents,
  type DefaultProvider,
} from "../../core";
import { Grid } from "../entities/Grid";
import { NodeEntity } from "../entities/NodeEntity";
import { Wire } from "../entities/Wire";
import { Camera } from "./Camera";
import { Tools } from "./toolManager/Tools";
import { CreateWireTool } from "./toolManager/tools/createWireTool";
import { SelectionTool } from "./toolManager/tools/SelectionTool";

interface Providers {
  camera: Camera;
  grid: Grid;
  tools: Tools;
}
interface Events {
  restoreTool: any;
}

export type AppProviders = Providers & DefaultProvider;
export type AppEvents = Events & DefaultEvents;

export class App extends Engine<AppProviders, AppEvents> {
  grid!: Grid;
  camera!: Camera;
  tools!: Tools;

  override onInit(): void {
    this.grid.init(this.context);
    this.tools.init(this.context);
    this.root.addChild(this.grid.getSprite());

    ///! the order of the tools is important
    this.tools.register(new CreateWireTool());
    this.tools.register(new SelectionTool());

    this.camera.move(250, 300);
    this.camera.scale(0.5, 0.5);
  }

  protected onCreate(): void {
    this.grid = new Grid();
    this.camera = new Camera(this.grid, this.world);
    this.tools = new Tools();
  }

  protected onRegisterContext(): void {
    this.context.provider.send("camera", () => this.camera);
    this.context.provider.send("grid", () => this.grid);
    this.context.provider.send("tools", () => this.tools);
    this.context.events.on("restoreTool", () => this.tools.restore());
  }

  protected onInitComponents(): void {
    this.world.addChild(new NodeEntity());
    const a = new NodeEntity();
    a.position.x += 600;
    this.world.addChild(a);
  }

  protected hitTest(e: { x: number; y: number; wX: number; wY: number }) {
    const children = this.world.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const item = children[i];
      if (item.getBounds().containsPoint(e.x, e.y)) {
        return item;
      }
    }
    return undefined;
  }

  protected onInitEvents(): void {
    this.mouse.on(MouseEventType.DOWN, (e) => {
      const hit = this.hitTest(e);
      this.tools.onDown(e, hit as Entity);
    });

    this.mouse.on(MouseEventType.MOVE, (e) => {
      this.tools.onMove(e);
    });

    this.mouse.on(MouseEventType.DRAG, (e) => {
      if (this.camera.onDrag(e)) return;
      this.tools.onDrag(e);
    });

    this.mouse.on(MouseEventType.UP, (e) => {
      this.tools.onUp(e);
    });
    this.mouse.on(MouseEventType.WHEEL, (e) => this.camera.onWheel(e));
    this.mouse.on(MouseEventType.OUTSIDE, (e) => this.tools.onOutside(e));
  }

  protected async onInitTextures() {
    this.grid.createTexture(this.context);
    this.assets.createTexture(NodeEntity.NAME, NodeEntity.createTexture());
  }
}
