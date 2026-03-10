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
import { Wire, NodeEntity, InputNode, OutputNode } from "./entities";
import { NodeRegister } from "./NodeRegister";
import { AddNodeTool } from "./toolManager/tools/AddNodeToo";
import { Simulator } from "./simlulator/Simulator";
import { ClipboardManager } from "./Clipboard";

interface Providers {
  componentCatalog: { name: string; src: string }[];
}
interface Events {
  restoreTool: any;

  setContextMenu: { name: string; id: string; data: any; color?: string }[];
  openContextMenu: { x: number; y: number };
  closeModal: any;
  contextOptionSelected: string;

  onComponentSelected: { name: string };
  openComponentCatalog: any;

  startSimulation: any;
  stopSimulation: any;

  openRename: string;
  getNewName: string;

  [T: `context_${string}`]: any;
}

export interface AppContext {
  grid: Grid;
  camera: Camera;
  tools: ToolManager;
  simulator: Simulator;
  clipboard: ClipboardManager;
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
  simualtor!: Simulator;
  clipboard!: ClipboardManager;

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
    this.tools.register(new AddNodeTool());

    this.g = new Graphics();
    this.g.beginPath();
    this.g.circle(0, 0, 15);
    this.g.fill(0xff0000);
    this.g.zIndex = 10;
  }

  protected onCreate(): void {
    this.grid = new Grid();
    this.camera = new Camera(this.grid, this.world);
    this.tools = new ToolManager();
    this.simualtor = new Simulator(this.world);
    this.clipboard = new ClipboardManager(this.world);
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
      if (!this.simualtor.started) {
        this.tools.onDown(e, hit as any);
      }
    });

    this.mouse.on(MouseEventType.DRAG, (e) => {
      this.camera.onDrag(e);
      if (!this.simualtor.started) {
        this.tools.onDrag(e);
      }
    });

    this.mouse.on(MouseEventType.MOVE, (e) => {
      this.world.detectInteracion(e);
      if (this.world.hasInteraction()) {
        if (this.world.onMove(e)) return;
      }
      if (!this.simualtor.started) {
        this.tools.onMove(e);
      }
    });

    this.mouse.on(MouseEventType.UP, (e) => {
      if (this.world.hasInteraction()) {
        if (this.world.onMouseUp(e)) return;
      }
      if (!this.simualtor.started) {
        this.tools.onUp(e);
      }
    });

    this.mouse.on(MouseEventType.WHEEL, (e) => {
      this.camera.onWheel(e);
    });

    this.mouse.on(MouseEventType.OUTSIDE, (e) => {
      this.tools.onOutside(e);
    });

    this.events.on("contextOptionSelected", (id) => {
      if (id != "copy") {
        this.context.tools.restore();
      }
    });

    this.events.on(
      "context_copy",
      (data: {
        selection: (Wire | NodeEntity)[];
        position: { x: number; y: number };
      }) => {
        this.clipboard.copy(
          data.selection.map((item) => item.toJson()),
          data.position,
        );
      },
    );

    this.events.on("context_pase", (position) => {
      this.clipboard.pase(position);
    });

    this.events.on("context_delete", (data: (Wire | NodeEntity)[]) => {
      data.forEach((data) => data.delete());
      this.tools.restore();
    });

    this.events.on("context_route", (wire: Wire[]) => {
      wire.forEach((wire) => {
        wire.recalc();
        wire.unSelect();
        wire.unSelectSegment();
      });
    });

    this.events.on("context_add", () => {
      this.events.emit("openComponentCatalog");
    });

    this.events.on("onComponentSelected", (data) => {
      this.tools.restore();
      this.tools.use("add-node");
      const tool = this.tools.getTool("add-node") as AddNodeTool;
      const node = NodeRegister.get(data.name);
      if (!node) return;
      node.select();
      node.visible = false;
      tool.hit = node;
      this.world.addChild(node);
    });

    this.providers.send("componentCatalog", () => {
      return NodeRegister.getNames().map((name) => ({
        name,
        src: this.assets.get(name).src,
      }));
    });

    this.events.on("startSimulation", () => {
      (this.tools.getTool("selection") as SelectionTool).unSelect();
      this.tools.restore();
      this.context.simulator.start();
    });

    this.events.on("stopSimulation", () => {
      this.context.simulator.stop();
    });
    let renameHit: InputNode | OutputNode;
    this.events.on("context_rename", (hit) => {
      renameHit = hit.selection[0] as InputNode | OutputNode;
      this.events.emit("openRename", renameHit.getName());
    });

    this.events.on("getNewName", (name) => {
      if (!renameHit) return;
      renameHit.rename(name);
    });
  }

  protected onUpdate(): void {
    this.simualtor.loop();
  }

  protected createContext(): AppEngineContext {
    const context = super.createContext();
    return {
      ...context,
      grid: this.grid,
      camera: this.camera,
      tools: this.tools,
      simulator: this.simualtor,
      clipboard: this.clipboard,
    };
  }

  public getEvents() {
    return this.events;
  }
  public getProviders() {
    return this.providers;
  }
}
