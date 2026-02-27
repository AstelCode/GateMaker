import type { AppEvents, AppProviders } from "../App";
import type { Context, EngineMouseEvent, Entity } from "../core";

export interface Tool {
  lock: boolean;
  keep: boolean;
  name: string;
  IsValid(e: EngineMouseEvent, hit: Entity): boolean;
  IsUnlock(e: EngineMouseEvent, hit: Entity): boolean;
  init?(context: Context<AppProviders, AppEvents>): void;
  load?(): void;
  onDown?(e: EngineMouseEvent, hits?: Entity): void;
  onDrag?(e: EngineMouseEvent): void;
  onUp?(e: EngineMouseEvent): void;
  onMove?(e: EngineMouseEvent): void;
  onWheel?(e: EngineMouseEvent): void;
  reset?(): void;
}

export class Tools {
  public context!: Context<AppProviders, AppEvents>;
  public tools!: Map<string, Tool>;
  public prev: Tool | null = null;
  public current: Tool | null = null;

  init(context: Context<any, any>) {
    this.context = context;
    this.tools = new Map();
  }

  register(tool: Tool) {
    tool.init?.(this.context);
    this.tools.set(tool.name, tool);
  }

  use(name: string) {
    this.prev = this.current;
    this.current = this.tools.get(name) ?? null;
    this.current?.load?.();
  }

  restore() {
    if (!this.current?.keep) this.current?.reset?.();
    this.prev = this.current;
    this.current = null;
  }

  checkTool(e: EngineMouseEvent, entity: Entity) {
    if (this.current) {
      if (this.current.IsUnlock(e, entity)) {
        this.restore();
      }
      return;
    }
    for (const [name, tool] of this.tools.entries()) {
      if (tool.IsValid(e, entity)) {
        this.use(name);
        break;
      }
    }
  }
  onDown(e: EngineMouseEvent, entity: Entity) {
    this.checkTool(e, entity);
    this.current?.onDown?.(e, entity);
  }
  onDrag(e: EngineMouseEvent) {
    this.current?.onDrag?.(e);
  }
  onMove(e: EngineMouseEvent) {
    this.current?.onMove?.(e);
  }
  onUp(e: EngineMouseEvent) {
    this.current?.onUp?.(e);
  }
}
