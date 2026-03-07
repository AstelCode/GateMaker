import { Graphics } from "pixi.js";
import { Camera } from "./Camera";
import { Entity, MouseEventType } from "./core";
import {
  Engine,
  type DefaultEvents,
  type DefaultProvider,
  type EngineContext,
} from "./core/Engine";
import { Grid } from "./Grid";

import { ToolManager } from "./toolManager/ToolManager";
import { SelectionTool } from "./toolManager/tools/SelectionTool";
import { CreateWireTool } from "./toolManager/tools/CreateWireTool";

import { EditWireTool } from "./toolManager/tools/EditWireTool";
import { Wire, AndNode, NodeEntity } from "./entities";
import { NodeRegister } from "./NodeRegister";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Providers {}
interface Events {
  restoreTool: any;

  setContextMenu: { name: string; id: string; data: any; color?: string }[];
  openContextMenu: { x: number; y: number };
  closeModal: any;
  contextOptionSelected: any;

  setComponentCatalog: { name: string; src: string }[];
  openComponentCatalog: { x: number; y: number };
  closeComponentCatalog: { x: number; y: number };
  onComponentSelected: { name: string; x: number; y: number };

  [T: `context_${string}`]: any;
}

export interface AppContext {
  grid: Grid;
  camera: Camera;
  tools: ToolManager;
}

export type AppProviders = Providers & DefaultProvider;
export type AppEvents = Events & DefaultEvents;

export type AppEntity = Entity<AppProviders, AppEvents, AppContext>;
export type AppEngineContext = EngineContext<
  AppProviders,
  AppEvents,
  AppContext
>;

export class App extends Engine<AppProviders, AppEvents, AppContext> {
  grid!: Grid;
  camera!: Camera;
  tools!: ToolManager;

  g!: Graphics;
  protected background: number = 0xf6f8fb;

  protected onInit(): void {
    this.grid.init(this.context);
    this.root.addChild(this.grid.sprite);
    this.tools.init(this.context);
    this.camera.move(
      this.app.canvas.width / 2 - 200,
      this.app.canvas.height / 2,
    );

    this.tools.register(new SelectionTool());
    this.tools.register(new CreateWireTool());
    this.tools.register(new EditWireTool());

    const node = new AndNode();
    this.world.addChild(node);
    const node1 = new AndNode();
    node1.position.x += 400;
    this.world.addChild(node1);

    this.g = new Graphics();
    this.g.beginPath();
    this.g.circle(0, 0, 15);
    this.g.fill(0xff0000);
    this.g.zIndex = 10;

    //this.world.addChild(this.g);
  }

  protected onCreate(): void {
    this.grid = new Grid();
    this.camera = new Camera(this.grid, this.world);
    this.tools = new ToolManager();
  }

  protected async onInitTextures(): Promise<void> {
    await this.assets.registerEntity(Grid);
    await this.assets.createTexture(NodeRegister.getTextures());
  }

  protected iniEvents() {
    this.mouse.on(MouseEventType.DOWN, (e) => {
      const hit = this.world.getHit();
      if (this.world.hasInteraction()) {
        if (this.world.onMouseDown(e)) return;
      }
      this.tools.onDown(e, hit as any);
    });

    this.mouse.on(MouseEventType.DRAG, (e) => {
      this.camera.onDrag(e);
      this.tools.onDrag(e);
    });

    this.mouse.on(MouseEventType.MOVE, (e) => {
      this.world.detectInteracion(e);
      if (this.world.hasInteraction()) {
        if (this.world.onMove(e)) return;
      }
      this.tools.onMove(e);
    });

    this.mouse.on(MouseEventType.UP, (e) => {
      if (this.world.hasInteraction()) {
        if (this.world.onMouseUp(e)) return;
      }
      this.tools.onUp(e);
    });

    this.mouse.on(MouseEventType.WHEEL, (e) => {
      this.camera.onWheel(e);
    });

    this.mouse.on(MouseEventType.OUTSIDE, (e) => {
      this.tools.onOutside(e);
    });

    this.events.on("contextOptionSelected", () => this.context.tools.restore());

    this.events.on("context_delete", (data: (Wire | NodeEntity)[]) => {
      data.forEach((data) => data.delete());
      this.tools.restore();
    });

    this.events.on("context_route", (wire: Wire[]) => {
      wire.forEach((wire) => wire.recalc());
    });

    this.events.on("context_add", (data) => {
      this.events.emit("openComponentCatalog", data);
    });
    this.events.on("onComponentSelected", (data) => {
      const node = new (NodeRegister.get(data.name)!)();
      node.position.set(data.x, data.y);
      this.world.addChild(node);
      AndNode.adjustPos(node);
    });
  }

  protected createContext(): AppEngineContext {
    const context = super.createContext();
    return {
      ...context,
      grid: this.grid,
      camera: this.camera,
      tools: this.tools,
    };
  }

  public getEvents() {
    return this.events;
  }

  public startUI() {
    this.events.emit(
      "setComponentCatalog",
      NodeRegister.getNames().map((name) => ({
        name,
        src: this.assets.get(name).src,
      })),
    );
  }
}
