import { Application, Container, Rectangle } from "pixi.js";
import { MouseController } from "./controllers/MouseController";
import { EventEmitter } from "./eventEmiter/EventEmitter";
import { AssetManager, type TextureData } from "./AssetManager/AssetManager";
import { World } from "./World";
import { Provider } from "./Providers/Provider";
import Stats from "stats.js";
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DefaultProvider {}

export interface DefaultEvents {
  init: undefined;
  resize: { width: number; height: number };
}

export type EngineContext<
  IProvider extends DefaultProvider,
  IEvents extends DefaultEvents,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  IContext extends {} = {},
> = {
  app: Application;
  providers: Provider<IProvider>;
  events: EventEmitter<IEvents>;
  assets: AssetManager;
  engine: Engine<IProvider, IEvents>;
  mouse: MouseController;
  world: World;
  root: Container;
} & IContext;

export interface LoadTexturesConstructor {
  loadTextures(): TextureData[];
}

export class Engine<
  IProviders extends DefaultProvider = DefaultProvider,
  IEvents extends DefaultEvents = DefaultEvents,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  IContext extends {} = {},
> {
  private container!: HTMLElement;
  private stats!: Stats;
  protected app: Application;

  protected root!: Container;
  protected world!: World;

  protected events!: EventEmitter<IEvents>;
  protected providers!: Provider<IProviders>;

  protected mouse!: MouseController;

  protected assets!: AssetManager;

  protected context!: EngineContext<IProviders, IEvents, IContext>;

  static loadTextures(): TextureData[] {
    return [];
  }

  constructor(container: HTMLElement) {
    this.app = new Application();
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.world = new World();
    this.container = container;
  }

  private resizeCallback = () => {
    if (!this.app.renderer) return;
    const dpr = window.devicePixelRatio || 1;
    const width = (this.container.clientWidth - 1) * dpr;
    const height = (this.container.clientHeight - 1) * dpr;
    this.app.renderer.resolution = dpr;
    this.app.renderer.resize(width, height);
    this.app.stage.hitArea ??= new Rectangle();
    (this.app.stage.hitArea as Rectangle).set(0, 0, width, height);

    this.events.emit("resize", { width, height });
  };

  private async createApp() {
    await this.app.init({
      background: "#ffffff",
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });
    this.container.appendChild(this.app.canvas);
    this.app.stage.eventMode = "dynamic";
    this.app.stage.hitArea = this.app.screen;

    this.root = this.app.stage;
    this.root.addChild(this.world);

    this.mouse = new MouseController(this.root, this.world, this.app.canvas);
    this.events = new EventEmitter();
    this.providers = new Provider();
    this.assets = new AssetManager(this.app.renderer);
    this.mouse.init();

    this.resizeCallback();
    window.addEventListener("resize", this.resizeCallback);

    //* fps display
    this.app.ticker.add(() => {
      this.stats.update();
    });
    this.container.appendChild(this.stats.dom);
  }

  async create() {
    await this.createApp();
    await this.onInitTextures?.();
    this.onCreate?.();
    this.initContext();
    this.onInit?.();
    this.iniEvents?.();
    this.app.ticker.add((delta) => {
      this.world.update(delta.deltaTime);
      this.onUpdate?.(delta.deltaTime);
    });

    this.events.emit("init");
  }

  destroy() {
    this.container.removeChild(this.stats.dom);
    this.events.clear();
    this.providers.clear();
    window.removeEventListener("resize", this.resizeCallback);
    this.app.destroy(true, { children: true, texture: true });
  }

  protected getContext() {
    if (!this.context) this.context = this.createContext();
    return this.context;
  }

  private initContext() {
    this.world.context = this.getContext();
  }

  protected createContext(): EngineContext<IProviders, IEvents, IContext> {
    return {
      app: this.app,
      providers: this.providers,
      events: this.events,
      assets: this.assets,
      mouse: this.mouse,
      engine: this,
      world: this.world,
      root: this.root,
    } as unknown as EngineContext<IProviders, IEvents, IContext>;
  }

  protected onCreate?(): void;
  protected onInit?(): void;
  protected iniEvents?(): void;
  protected onInitTextures?(): Promise<void>;
  protected onUpdate?(delta: number): void;
}
