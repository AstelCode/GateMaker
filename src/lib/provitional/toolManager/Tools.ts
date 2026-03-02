import type { AppEvents, AppProviders } from "../App";
import type { Context, EngineMouseEvent, Entity } from "../../../core";

export interface Tool {
  name: string;
  priority: number;
  keep?: boolean;
  context: Context<AppProviders, AppEvents>;
  IsValid(e: EngineMouseEvent, hit?: Entity): boolean;
  IsUnlock(e: EngineMouseEvent, hit?: Entity): boolean;
  init?(): void;
  load?(): void;
  onDown?(e: EngineMouseEvent, hits?: Entity): void;
  onDrag?(e: EngineMouseEvent): void;
  onUp?(e: EngineMouseEvent): void;
  onMove?(e: EngineMouseEvent): void;
  onWheel?(e: EngineMouseEvent): void;
  onOutside?(e: EngineMouseEvent): void;
  reset?(): void;
}

export class Tools {
  public context!: Context<AppProviders, AppEvents>;
  private registry = new Map<string, Tool>();
  private sorted: Tool[] = [];
  private stack: Tool[] = [];

  get current(): Tool | null {
    return this.stack[this.stack.length - 1] ?? null;
  }

  init(context: Context<any, any>) {
    this.context = context;
  }

  register(tool: Tool) {
    tool.context = this.context;
    tool.init?.();
    this.registry.set(tool.name, tool);
    this.sorted = [...this.registry.values()].sort(
      (a, b) => b.priority - a.priority,
    );
  }

  activate(tool: Tool) {
    tool.load?.();
    this.stack.push(tool);
  }

  restore() {
    const tool = this.stack.pop();
    tool?.reset?.();
  }

  tryActivate(e: EngineMouseEvent, hit?: Entity) {
    if (this.current) return;

    console.log(this.sorted);
    for (const tool of this.sorted) {
      if (tool.IsValid(e, hit)) {
        this.activate(tool);
        break;
      }
    }
  }

  checkUnlock(e: EngineMouseEvent, hit?: Entity) {
    const tool = this.current;
    if (!tool) return;

    if (tool.IsUnlock?.(e, hit)) {
      if (!tool.keep) {
        this.restore();
      }
    }
  }

  onDown(e: EngineMouseEvent, hit?: Entity) {
    this.checkUnlock(e, hit);
    this.tryActivate(e, hit);
    this.current?.onDown?.(e, hit);
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

  onOutside(e: EngineMouseEvent) {
    this.current?.onOutside?.(e);
  }
}
