import { Application, Container, Rectangle } from "pixi.js";
import { MouseController } from "./controllers/MouseController";
import { Provider } from "./Provider";
import { EventEmitter } from "./EventEmiter";
import { AssetManager } from "./AssetManager";
import type { Entity } from "./Entity";
import { World } from "./World";
import Stats from "stats.js";
import { Log } from "./Log";

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
  Events extends DefaultEvents,
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
  U extends DefaultEvents = DefaultEvents, // U ya contiene a resize e init
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
  private stats: Stats;

  constructor(container: HTMLElement) {
    this.app = new Application();
    this.stats = new Stats();
    this.stats.showPanel(0);
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
    this.onResize?.(width, height);
  };

  //#region  principal methods
  async init() {
    Log.info("APP", "Initializing application...");

    await this.iniApp();
    Log.info("APP", "Core app created");

    this.initProviders();
    Log.info("APP", "Providers initialized");

    this.onCreate?.();
    Log.info("APP", "onCreate hook executed");

    this.mouse.initEvents();
    Log.info("APP", "Mouse controller connected");

    await this.onInitTextures?.();
    Log.info("APP", "Textures loaded");

    this.onInit?.();
    Log.info("APP", "onInit hook executed");

    this.onRegisterContext?.();
    Log.info("APP", "Context registered");

    this.onInitComponents?.();
    Log.info("APP", "Components initialized");

    this.app.renderer.render(this.app.stage);
    Log.info("APP", "First render complete");

    this.onInitEvents?.();
    Log.info("APP", "Event system initialized");

    this.context.events.emit("init");
    Log.info("APP", "Init event emitted");
    this.app.ticker.add((delta) => {
      this.world.update(delta.deltaTime);
      this.onUpdate?.(delta.deltaTime);
    });
    Log.info("APP", "Game loop started");
    Log.info("APP", "Application initialization complete ✅");
  }

  private async iniApp() {
    await this.app.init({ background: "#ffffff", antialias: true });
    this.container.appendChild(this.app.canvas);
    this.container.appendChild(this.stats.dom);
    this.app.stage.eventMode = "dynamic";
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.addChild(this.world);
    this.mouse = new MouseController(
      this.app.stage,
      this.world,
      this.app.canvas,
    );
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

    this.app.ticker.add(() => {
      this.stats.update();
    });
  }

  private initProviders() {
    this.context.provider.send("app", () => this.app);
    this.context.provider.send("world", () => this.world);
    this.context.provider.send("mouseController", () => this.mouse);
  }

  destroy() {
    this.container.removeChild(this.stats.dom);
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
  protected onCreate?(): void;
  protected onInitTextures?(): Promise<void>;
  protected onRegisterContext?(): void;
  protected onInitEvents?(): void;
  protected onInitComponents?(): void;
  protected onInit?(): void;

  protected onResize?(width: number, height: number): void;
  protected onUpdate?(delta: number): void;
  //#endregion
}
