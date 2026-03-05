import type {
  AppContext,
  AppEngineContext,
  AppEntity,
  AppEvents,
  AppProviders,
} from "../App";
import type { EngineContext, EngineMouseEvent, Entity } from "../core";

export interface Tool {
  name: string;
  priority: number;
  keep?: boolean;
  context: AppEngineContext;
  IsValid(e: EngineMouseEvent, hit?: AppEntity): boolean;
  IsUnlock(e: EngineMouseEvent, hit?: AppEntity): boolean;
  init?(): void;
  load?(): void;
  onDown?(e: EngineMouseEvent, hit?: AppEntity): void;
  onDrag?(e: EngineMouseEvent): void;
  onUp?(e: EngineMouseEvent): void;
  onMove?(e: EngineMouseEvent, hit?: AppEntity): void;
  onWheel?(e: EngineMouseEvent): void;
  onOutside?(e: EngineMouseEvent): void;
  onGlobalMove?(e: EngineMouseEvent, hit?: AppEntity): void;
  reset?(): void;
  destroy?(): void;
}
export class ToolManager {
  public context!: EngineContext<AppProviders, AppEvents, AppContext>;
  private registry = new Map<string, Tool>();
  private sorted: Tool[] = [];
  current: Tool | null = null;

  init(context: EngineContext<AppProviders, AppEvents, AppContext>) {
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
    this.current = tool;
  }

  use(name: string) {
    const tool = this.registry.get(name);
    if (tool) this.activate(tool);
  }

  restore() {
    this.current?.reset?.();
    this.current = null;
  }

  tryActivate(e: EngineMouseEvent, hit?: AppEntity) {
    if (this.current) return;
    for (const tool of this.sorted) {
      if (tool.IsValid(e, hit)) {
        this.activate(tool);
        break;
      }
    }
  }

  checkUnlock(e: EngineMouseEvent, hit?: AppEntity) {
    const tool = this.current;
    if (!tool) return;
    if (!tool.keep) {
      this.current?.reset?.();
    }
    if (tool.IsUnlock?.(e, hit)) {
      this.restore();
    }
  }

  callDown(e: EngineMouseEvent, hit?: AppEntity) {
    this.current?.onDown?.(e, hit);
  }

  callDrag(e: EngineMouseEvent) {
    this.current?.onDrag?.(e);
  }

  callMove(e: EngineMouseEvent) {
    this.current?.onMove?.(e);
  }

  callUp(e: EngineMouseEvent) {
    this.current?.onUp?.(e);
  }

  callOutside(e: EngineMouseEvent) {
    this.current?.onOutside?.(e);
  }

  onDown(e: EngineMouseEvent, hit?: AppEntity) {
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

  destroy() {
    for (const [_, tool] of this.registry.entries()) {
      tool.destroy?.();
    }
  }
}
