import { Application, Container, Rectangle } from "pixi.js";
import { MouseController } from "./controllers/MouseController";
import { Provider } from "./Provider";
import { EventEmitter } from "./EventEmiter";
import { AssetManager } from "./AssetManager";
import type { Entity } from "./Entity";
import { World } from "./World";

export interface DefaultProvider {
  app: Application;
  world: Container;
  mouseController: MouseController;
}

export interface DefaultEvents {
  init: undefined; // Mejor usar undefined que any para el emit
  resize: { width: number; height: number };
}

export interface Context<
  Promider extends DefaultProvider,
  Events extends DefaultEvents
> {
  app: Application;
  provider: Provider<Promider>;
  events: EventEmitter<Events>;
  assets: AssetManager;
  engine: Engine<Promider, Events>;
  world: World;
  root: Container;
}

export class Engine<
  T extends DefaultProvider = DefaultProvider,
  U extends DefaultEvents = DefaultEvents // U ya contiene a resize e init
> {
  private container: HTMLElement;
  protected root!: Container;
  protected world: World;
  protected app: Application;
  protected mouse!: MouseController;
  protected assets!: AssetManager;
  protected provider!: Provider<T>;
  protected events!: EventEmitter<U>;
  protected context!: Context<T, U>;

  constructor(container: HTMLElement) {
    this.app = new Application();
    this.world = new World();
    this.container = container;
  }

  private resizeCallback = () => {
    if (!this.app.renderer) return;

    const width = this.container.clientWidth - 1;
    const height = this.container.clientHeight - 1;
    this.app.renderer.resize(width, height);
    if (this.app.stage.hitArea) {
      (this.app.stage.hitArea as Rectangle).set(0, 0, width, height);
    } else {
      this.app.stage.hitArea = new Rectangle(0, 0, width, height);
    }
    this.context.events.emit("resize", {
      width,
      height,
    });
    this.onResize(width, height);
  };

  //#region  principal methods
  async init() {
    await this.iniApp();
    this.initProviders();
    this.mouse.initEvents();
    await this.onInitTextures();
    this.onInit();
    this.app.renderer.render(this.app.stage);
    this.onInitEvents();
    this.context.events.emit("init");

    this.app.ticker.add((delta) => {
      this.world.update(delta.deltaTime);
      this.onUpdate(delta.deltaTime);
    });
  }

  private async iniApp() {
    await this.app.init({ background: "#ffffff" });
    this.container.appendChild(this.app.canvas);
    this.app.stage.eventMode = "dynamic";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.addChild(this.world);
    this.mouse = new MouseController(this.app.stage, this.app.canvas);
    this.assets = new AssetManager(this.app.renderer);
    this.provider = new Provider();
    this.events = new EventEmitter();
    this.root = this.app.stage;
    this.context = {
      provider: this.provider,
      events: this.events,
      assets: this.assets,
      engine: this,
      world: this.world,
      app: this.app,
      root: this.root,
    };
    this.world.setContext(this.context);
    this.resizeCallback();
    window.addEventListener("resize", this.resizeCallback);
  }

  private initProviders() {
    this.context.provider.send("app", () => this.app);
    this.context.provider.send("world", () => this.world);
    this.context.provider.send("mouseController", () => this.mouse);
  }

  destroy() {
    this.context.provider.clear();
    this.context.events.clear();
    window.removeEventListener("resize", this.resizeCallback);
    this.app.destroy(true, { children: true, texture: true });
  }
  //#endregion
  //#region node control
  public addChild(e: Entity) {
    this.world.addChild(e);
    e.init(this.context as any);
  }
  //#endregion
  //#region  internal methods
  protected onInit() {}
  protected onResize(width: number, height: number) {}
  protected async onInitTextures() {}
  protected onUpdate(delta: number) {}
  protected onInitEvents() {}
  //#endregion
}
