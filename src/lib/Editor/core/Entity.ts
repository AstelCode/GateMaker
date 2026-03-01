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
  public getSelectionBounds(): BoundingBox | undefined {
    return undefined;
  }
}
export type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function mergeBound(selection: Entity[]): BoundingBox {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const item of selection) {
    const bound = item.getSelectionBounds();
    if (!bound) continue;
    if (minX > bound.minX) minX = bound.minX;
    if (minY > bound.minY) minY = bound.minY;
    if (maxX < bound.maxX) maxX = bound.maxX;
    if (maxY < bound.maxY) maxY = bound.maxY;
  }
  return { minX, minY, maxX, maxY };
}
