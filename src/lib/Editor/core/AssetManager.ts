import { Assets, Graphics, Rectangle, type Renderer, Texture } from "pixi.js";

export class AssetManager {
  private cache = new Map<string, Texture>();
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  async loadTexture(key: string, url: string): Promise<Texture> {
    if (this.cache.has(key)) return this.cache.get(key)!;

    const texture = await Assets.load(url);
    this.cache.set(key, texture);
    return texture;
  }

  registerTexture(key: string, texture: Texture) {
    this.cache.set(key, texture);
  }

  createTexture(
    key: string,
    draw: (g: Graphics) => Rectangle,
    options?: { resolution?: number }
  ): Texture {
    if (this.cache.has(key)) return this.cache.get(key)!;

    const graphics = new Graphics();
    const frame = draw(graphics);

    const texture = this.renderer.generateTexture({
      target: graphics,
      resolution: options?.resolution ?? 1,
      frame: frame,
    });

    graphics.destroy({ children: true });

    this.cache.set(key, texture);
    return texture;
  }

  get(key: string): Texture {
    const tex = this.cache.get(key);
    if (!tex) {
      throw new Error(`Texture "${key}" not found`);
    }
    return tex;
  }

  unload(key: string) {
    const texture = this.cache.get(key);
    if (texture) {
      texture.destroy(true);
      this.cache.delete(key);
    }
  }

  clear() {
    this.cache.forEach((tex) => tex.destroy(true));
    this.cache.clear();
  }
}
