import { Graphics } from "pixi.js";
import { Camera } from "./Camera";
import { Entity, MouseEventType, Vector } from "./core";
import {
  Engine,
  type DefaultEvents,
  type DefaultProvider,
  type EngineContext,
} from "./core/Engine";
import { Grid } from "./Grid";
import { NodeEntity } from "./entities/NodeEntity";
import { ToolManager } from "./toolManager/ToolManager";
import { SelectionTool } from "./toolManager/tools/SelectionTool";
import { CreateWireTool } from "./toolManager/tools/CreateWireTool";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Providers {}
interface Events {
  restoreTool: any;
}

export interface AppContext {
  grid: Grid;
  camera: Camera;
  tools: ToolManager;
}

export type AppProviders = Providers & DefaultProvider;
export type AppEvents = Events & DefaultEvents;

export class App extends Engine<AppProviders, AppEvents, AppContext> {
  grid!: Grid;
  camera!: Camera;
  tools!: ToolManager;

  g!: Graphics;

  protected onInit(): void {
    this.grid.init(this.context);
    this.root.addChild(this.grid.sprite);
    this.tools.init(this.context);
    this.camera.move(this.app.canvas.width / 2, this.app.canvas.height / 2);

    this.tools.register(new SelectionTool());
    this.tools.register(new CreateWireTool());

    const node = new NodeEntity();
    this.world.addChild(node);
    const node1 = new NodeEntity();
    node1.position.x += 400;
    this.world.addChild(node1);

    this.g = new Graphics();
    this.g.beginPath();
    this.g.circle(0, 0, 15);
    this.g.fill(0xff0000);
    this.g.zIndex = 10;

    this.world.addChild(this.g);
  }

  protected onCreate(): void {
    this.grid = new Grid();
    this.camera = new Camera(this.grid, this.world);
    this.tools = new ToolManager();
    this.events.on("restoreTool", () => this.tools.restore());
  }

  protected async onInitTextures(): Promise<void> {
    this.assets.registerEntity(Grid);
    this.assets.registerEntity(NodeEntity);
  }

  private findHit(p: Vector): Entity | undefined {
    for (let i = this.world.children.length - 1; 0 <= i; i--) {
      const item = this.world.children[i];
      if (item instanceof Entity) {
        if (!item.bounding?.pointInside(p)) continue;
        if (item.collider?.pointInside(p)) {
          return item;
        }
      }
    }
    return undefined;
  }

  protected iniEvents() {
    this.mouse.on(MouseEventType.DOWN, (e) => {
      const hit = this.findHit(new Vector(e.wX, e.wY));
      this.tools.onDown(e, hit);
    });
    this.mouse.on(MouseEventType.DRAG, (e) => {
      this.camera.onDrag(e);
      this.tools.onDrag(e);
    });
    this.mouse.on(MouseEventType.MOVE, (e) => {
      this.tools.onMove(e);
    });

    this.mouse.on(MouseEventType.UP, (e) => {
      this.tools.onUp(e);
    });

    this.mouse.on(MouseEventType.WHEEL, (e) => {
      this.camera.onWheel(e);
    });
    this.mouse.on(MouseEventType.OUTSIDE, (e) => {
      this.tools.onOutside(e);
    });
  }

  protected createContext(): EngineContext<
    AppProviders,
    AppEvents,
    AppContext
  > {
    const context = super.createContext();
    return {
      ...context,
      grid: this.grid,
      camera: this.camera,
      tools: this.tools,
    };
  }
}
