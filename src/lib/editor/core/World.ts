import { Container } from "pixi.js";
import { Entity } from "./Entity";
import type { EngineContext } from "./Engine";
import { Vector } from "./math/Vector";
import type { EngineMouseEvent } from "./controllers/MouseController";

export class World extends Container {
  context!: EngineContext<any, any>;

  constructor() {
    super();
    this.sortableChildren = true;
  }

  addChild<T extends Container[]>(...children: T): T[0] {
    const child = super.addChild(...children);
    if (child instanceof Entity) {
      child.context = this.context;
      child.init();
    }
    return child;
  }

  update(delta: number) {
    this.updateRecursive(this, delta);
  }

  private updateRecursive(container: Container, delta: number) {
    for (const child of container.children) {
      if (child instanceof Entity) {
        child.update(delta);
      }

      if (child instanceof Container && child.children.length > 0) {
        this.updateRecursive(child, delta);
      }
    }
  }

  public hit?: Entity;
  public prevHit?: Entity;
  public active: boolean = false;
  public currentHit?: Entity;

  public findHit(p: Vector) {
    for (let i = this.children.length - 1; 0 <= i; i--) {
      const item = this.children[i];
      if (item instanceof Entity) {
        if (!item.bounding?.pointInside(p)) continue;
        if (!item.collider?.pointInside(p)) continue;
        return item;
      }
    }
    return undefined;
  }

  public onMouseDown(e: EngineMouseEvent) {
    if (!this.hit) return;
    return this.hit._mouseDown(e);
  }

  public onMouseUp(e: EngineMouseEvent) {
    if (!this.hit) return;
    return this.hit._mouseUp(e);
  }

  public onMove(e: EngineMouseEvent) {
    if (!this.hit) return;
    return this.hit?._mouseMove(e);
  }

  public detectInteracion(e: EngineMouseEvent) {
    const hit = this.findHit(new Vector(e.wX, e.wY));
    this.currentHit = hit;
    if (!hit && this.prevHit) {
      this.prevHit?._mouseLeave(e);
      this.prevHit = undefined;
      return;
    }
    if (this.hit != hit) {
      this.active = hit?._mouseHover(e) ?? true;
      this.prevHit = this.hit;
      this.hit = hit;
    }
  }

  public hasInteraction() {
    return this.active;
  }

  public getHit() {
    return this.currentHit;
  }
}
