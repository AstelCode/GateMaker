import { Container } from "pixi.js";
import type { Context, DefaultEvents, DefaultProvider } from "./Engine";

export class Entity extends Container {
  public id: string;
  public isReady: boolean;

  constructor() {
    super();
    this.id = crypto.randomUUID();
    this.eventMode = "auto";
    //this.eventMode = "static";
    this.isReady = false;
  }

  public init(context: Context<DefaultProvider, DefaultEvents>) {
    if (this.isReady) return;
    this.onInit?.(context);
    this.isReady = true;
  }

  public update(_delta: number) {
    this.onUpdate?.(_delta);
  }

  protected onInit?(context: Context<DefaultProvider, DefaultEvents>): void;
  protected onUpdate?(_delta: number): void;
}
