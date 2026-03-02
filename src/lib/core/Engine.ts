import { Application, Container, Rectangle } from "pixi.js";
import { MouseController } from "./controllers/MouseController";
import { EventEmitter } from "./EventEmiter/EventEmitter";
import type { AssetManager } from "./AssetManager/AssetManager";
import { World } from "./World";
import { Provider } from "./Providers/Provider";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DefaultProvider {}

export interface DefaultEvents {
  init: undefined;
  resize: { width: number; height: number };
}

export interface EngineContext<
  IProvider extends DefaultProvider,
  IEvents extends DefaultEvents,
> {
  providers: Provider<IProvider>;
  events: EventEmitter<IEvents>;
  assets: AssetManager;
  engine: Engine<IProvider, IEvents>;
  mouse: MouseController;
  world: World;
  root: Container;
}

export class Engine<
  T extends DefaultProvider = DefaultProvider,
  U extends DefaultEvents = DefaultEvents,
> {
  private container!: HTMLElement;
  private stats!: Stats;
  private app: Application;

  protected root!: Container;
  protected world!: World;

  protected events!: EventEmitter<U>;
  protected providers!: Provider<T>;

  protected mouse!: MouseController;

  protected assets!: AssetManager;

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

    this.app.stage.hitArea ??= new Rectangle();
    (this.app.stage.hitArea as Rectangle).set(0, 0, width, height);

    this.events.emit("resize", { width, height });
  };

  private async createApp() {
    await this.app.init({ background: "#ffffff", antialias: true });
    this.container.appendChild(this.app.canvas);

    this.app.stage.eventMode = "dynamic";
    this.app.stage.hitArea = this.app.screen;

    this.root = this.app.stage;
    this.root.addChild(this.world);

    this.mouse = new MouseController(this.root, this.world, this.app.canvas);
    this.events = new EventEmitter();
    this.providers = new Provider();
    this.mouse.init();

    this.world.context = this.createContext();

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

  protected createContext(): EngineContext<T, U> {
    return {
      providers: this.providers,
      events: this.events,
      assets: this.assets,
      mouse: this.mouse,
      engine: this,
      world: this.world,
      root: this.root,
    };
  }

  protected onCreate?(): void;
  protected onInitTextures?(): Promise<void>;
  protected onUpdate?(delta: number): void;
}
