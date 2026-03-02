import { Container, Graphics, Rectangle, TilingSprite } from "pixi.js";
import { Entity, type EngineContext, type TextureData } from "../core";

function createTexture(): TextureData[] {
  const container = new Container();
  const g = new Graphics();
  container.addChild(g);
  const cs = Grid.cellSize;
  const color = 0xc0c0c0;
  const cornerSize = 10;
  g.beginPath();
  g.moveTo(0, cornerSize);
  g.lineTo(0, 0);
  g.lineTo(cornerSize, 0);
  g.stroke({ width: 2, color });

  g.beginPath();
  g.moveTo(cs, cs - cornerSize);
  g.lineTo(cs, 0);
  g.lineTo(cs, cornerSize);
  g.stroke({ width: 2, color });

  return [
    {
      name: "GRID",
      container,
      resolution: 3,
      frame: new Rectangle(0, 0, cs, cs),
    },
  ];
}

export class Grid {
  static cellSize: number = 50;
  private sprite!: TilingSprite;

  static loadTextures() {
    return createTexture();
  }

  init(context: EngineContext<any, any>) {
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
}
