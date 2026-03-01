import { Graphics, Point, Rectangle, TilingSprite } from "pixi.js";
import type { Context } from "../core";
import { fastFloor } from "../utils";

export class Grid {
  static CELL_SIZE: number = 50;
  sprite!: TilingSprite;

  createTexture(context: Context<any, any>) {
    const g = new Graphics();
    const cs = Grid.CELL_SIZE;
    const radius = 4;
    const color = 0xc0c0c0;

    g.beginPath();
    g.setFillStyle({ color });
    g.arc(cs / 2, cs / 2, radius, 0, Math.PI * 2);
    g.fill();

    const texture = context.app.renderer.generateTexture({
      target: g,
      frame: new Rectangle(0, 0, Grid.CELL_SIZE, Grid.CELL_SIZE),
      resolution: 3,
    });

    g.destroy();
    context.assets.registerTexture("GRID", texture);
  }

  init(context: Context<any, any>) {
    const texture = context.assets.get("GRID");
    if (!texture) {
      console.error("¡La textura GRID no fue registrada!");
      return;
    }

    this.sprite = new TilingSprite({
      texture: texture,
      width: 2000,
      height: 2000,
    });
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.zIndex = -1;
  }

  getSprite() {
    return this.sprite;
  }

  static snapRound(p: { x: number; y: number }) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    p.x = Math.round(p.x * inv) * s;
    p.y = Math.round(p.y * inv) * s;
  }

  static snapRoundValue(x: number) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    return Math.round(x * inv) * s;
  }

  static snapFloor(p: { x: number; y: number }) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    p.x = fastFloor(p.x * inv) * s;
    p.y = fastFloor(p.y * inv) * s;
  }

  static snapFloorValue(x: number) {
    const s = this.CELL_SIZE;
    const inv = 1 / s;
    return fastFloor(x * inv) * s;
  }
}
