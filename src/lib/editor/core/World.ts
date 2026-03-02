import { Container } from "pixi.js";
import { Entity } from "./Entity";
import type { EngineContext } from "./Engine";

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
}
