import { Container } from "pixi.js";
import type { Context, DefaultEvents, DefaultProvider } from "./Engine";

export class Entity extends Container {
  public id: string;
  public isReady: boolean;

  constructor() {
    super();
    this.id = crypto.randomUUID();
    this.eventMode = "static";
    this.isReady = false;
  }

  init(context: Context<DefaultProvider, DefaultEvents>) {
    if (this.isReady) return;
    this.onInit(context);
    this.isReady = true;
  }

  update(_delta: number) {
    this.onUpdate(_delta);
  }

  protected onInit(context: Context<DefaultProvider, DefaultEvents>) {}
  protected onUpdate(_delta: number) {}
}
