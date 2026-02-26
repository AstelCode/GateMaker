import { Graphics, Rectangle, TilingSprite } from "pixi.js";
import type { World } from "./core/World";
import type { Context } from "./core";

export class Grid {
  sprite!: TilingSprite;
  constructor(public size: number = 50) {}

  createTexture(context: Context<any, any>) {
    const g = new Graphics();
    // Usamos un color más visible para probar (ej. negro 0x000000)
    g.beginPath()
      .setStrokeStyle({ width: 4, color: 0xcccccc, alpha: 1 })
      .moveTo(0, 0)
      .lineTo(0, this.size)
      .moveTo(0, 0)
      .lineTo(this.size, 0)
      .stroke();

    const texture = context.app.renderer.generateTexture({
      target: g,
      frame: new Rectangle(0, 0, this.size, this.size),
    });

    g.destroy();
    context.assets.registerTexture("GRID", texture);
  }

  init(context: Context<any, any>) {
    const texture = context.assets.get("GRID");

    // IMPORTANTE: Si la textura no existe, fallará
    if (!texture) {
      console.error("¡La textura GRID no fue registrada!");
      return;
    }

    this.sprite = new TilingSprite({
      texture: texture,
      width: 5000,
      height: 5000,
    });
    this.sprite.x = 0;
    this.sprite.y = 0;
    console.log("Textura GRID:", texture.width, "x", texture.height);
  }

  getSprite() {
    return this.sprite;
  }
}
