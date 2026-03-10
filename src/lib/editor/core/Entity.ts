/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Container } from "pixi.js";
import type { DefaultEvents, DefaultProvider, EngineContext } from "./Engine";
import { AABB } from "./AABB/AABB";
import { uuid } from "./utils/uuid";
import type { Collider } from "./colliders/ICollider";
import type { BoxCollider } from "./colliders/BoxCollider";
import type { EngineMouseEvent } from "./controllers/MouseController";

export class Entity<
  T extends DefaultProvider = DefaultProvider,
  U extends DefaultEvents = DefaultEvents,
  Z extends {} = {},
> extends Container {
  public id: string;
  protected dirtyLayout: boolean;
  public context!: EngineContext<T, U, Z>;
  public collider?: Collider;
  public bounding?: AABB;
  public interactionBox?: BoxCollider;
  public selected: boolean = false;

  constructor() {
    super();
    this.id = uuid();
    this.eventMode = "none";
    this.dirtyLayout = true;
  }

  public select() {
    this.selected = true;
  }

  public unSelect() {
    this.selected = false;
  }

  public update(_delta: number) {
    this.onUpdate?.(_delta);
    for (const child of this.children) {
      if (child instanceof Entity) {
        child.update(_delta);
      }
    }
    this.updateLayout();
  }

  protected onInit?(): void;
  public init() {
    this.onInit?.();
  }

  //#region update layout
  protected onDirty?(): void;
  protected onUpdate?(_delta: number): void;
  protected updateCollider?(): void;

  public markDirty(): void {
    if (this.dirtyLayout) return;
    this.dirtyLayout = true;
    if (this.parent instanceof Entity) {
      this.parent.markDirty();
    }
  }

  private updateLayout() {
    if (!this.dirtyLayout) return;

    this.forceLayoutUpdate();
    this.dirtyLayout = false;
  }

  public forceLayoutUpdate() {
    this.updateCollider?.();
    this.updateBounding();
    this.onDirty?.();
  }

  protected updateInteractionBounding() {
    if (!this.interactionBox) return;
    this.interactionBox.center.set(this.position);
  }

  private updateBounding() {
    if (this.collider) {
      if (!this.bounding) this.bounding = this.collider?.getAABB();
      else this.collider.getAABB(this.bounding);
      this.updateInteractionBounding();
    } else {
      if (!this.collider && this.children.length === 0) {
        this.bounding = undefined;
        return;
      }
      if (!this.bounding) {
        this.bounding = AABB.merge(
          this.children.filter((c): c is Entity => c instanceof Entity),
          (item) => item.bounding,
        );
      } else {
        AABB.merge(
          this.children.filter((c): c is Entity => c instanceof Entity),
          (item) => item.bounding,
          this.bounding,
        );
      }
    }
  }

  //#endregion

  //#region mouse events
  public _mouseUp(e: EngineMouseEvent): boolean | void {
    return this.onMouseUp?.(e);
  }
  public _mouseDown(e: EngineMouseEvent): boolean | void {
    return this.onMouseDown?.(e);
  }
  public _mouseMove(e: EngineMouseEvent): boolean | void {
    return this.onMouseMove?.(e);
  }
  public _mouseClick(e: EngineMouseEvent): boolean | void {
    return this.onMouseClick?.(e);
  }
  public _mouseWheel(e: EngineMouseEvent): boolean | void {
    return this.onMouseWheel?.(e);
  }
  public _mouseHover(e: EngineMouseEvent): boolean | void {
    return this.onMouseHover?.(e);
  }
  public _mouseLeave(e: EngineMouseEvent): boolean | void {
    return this.onMouseLeave?.(e);
  }

  protected onMouseHover?(e: EngineMouseEvent): boolean | void;
  protected onMouseWheel?(e: EngineMouseEvent): boolean | void;
  protected onMouseDown?(e: EngineMouseEvent): boolean | void;
  protected onMouseUp?(e: EngineMouseEvent): boolean | void;
  protected onMouseClick?(e: EngineMouseEvent): boolean | void;
  protected onMouseMove?(e: EngineMouseEvent): boolean | void;
  protected onMouseLeave?(e: EngineMouseEvent): boolean | void;

  //#endregion

  public toJson() {
    return {};
  }
}
