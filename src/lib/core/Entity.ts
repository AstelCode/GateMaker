import { Container } from "pixi.js";
import type { EngineContext } from "./Engine";
import { AABB } from "./AABB/AABB";
import { uuid } from "./utils/uuid";
import type { Collider } from "./colliders/ICollider";
import type { Vector } from "./math/Vector";

export class Entity extends Container {
  public id: string;
  protected dirtyLayout: boolean;
  public context!: EngineContext<any, any>;
  public collider?: Collider;
  public bounding?: AABB;

  constructor() {
    super();
    this.id = uuid();
    this.eventMode = "none";
    this.dirtyLayout = true;
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

  //#region

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

  public updateBounding() {
    if (this.collider) {
      if (!this.bounding) this.bounding = this.collider?.getAABB();
      else this.collider.getAABB(this.bounding);
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
  public _mouseUp(pos: Vector): void {
    this.onMouseUp?.(pos);
  }
  public _mouseDown(pos: Vector): void {
    this.onMouseDown?.(pos);
  }
  public _mouseMove(pos: Vector): void {
    this.onMouseMove?.(pos);
  }
  public _mouseClick(pos: Vector): void {
    this.onMouseClick?.(pos);
  }

  public _mouseWheel(pos: Vector): void {
    this.onMouseWheel?.(pos);
  }
  protected onMouseWheel?(pos: Vector): void;
  protected onMouseDown?(pos: Vector): void;
  protected onMouseUp?(pos: Vector): void;
  protected onMouseClick?(pos: Vector): void;
  protected onMouseMove?(pos: Vector): void;

  //#endregion
}
