import { Container } from "pixi.js";
import type { Context } from "./Engine";
import { Entity } from "./Entity";

export class World extends Container {
  private context!: Context<any, any>;
  constructor() {
    super();
  }

  setContext(context: Context<any, any>) {
    this.context = context;
  }

  addChild<T extends Container[]>(...children: T): T[0] {
    const child = super.addChild(...children);

    if (child instanceof Entity) {
      child.init(this.context);
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
