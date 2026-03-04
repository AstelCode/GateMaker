import { Assets, Container, Rectangle, type Renderer, Texture } from "pixi.js";

export interface TextureData {
  container: Container;
  frame: Rectangle;
  resolution: number;
  name: string;
}
export type TextureGenerator = () => TextureData;

interface createTextureConstructor {
  loadTextures?(): TextureGenerator[];
}
export class AssetManager {
  private cache = new Map<string, Texture>();
  private generators = new Map<string, TextureGenerator>();
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

  createTexture(generators: TextureGenerator[] | TextureGenerator) {
    if (!Array.isArray(generators)) {
      generators = [generators];
    }
    for (const generator of generators) {
      const data = generator();
      this.generators.set(data.name, generator);
      this.generateAndCache(data);
    }
  }

  registerEntity(entity: createTextureConstructor) {
    if (entity.loadTextures) this.createTexture(entity.loadTextures());
  }

  reloadTexture(key: string): Texture {
    const generator = this.generators.get(key);

    if (!generator) {
      throw new Error(`No generator callback found for texture: "${key}"`);
    }
    const oldTexture = this.cache.get(key);
    if (oldTexture) {
      oldTexture.destroy(true);
    }
    const newData = generator();
    return this.generateAndCache(newData);
  }

  private generateAndCache(data: TextureData): Texture {
    const texture = this.renderer.generateTexture({
      target: data.container,
      resolution: data.resolution,
      frame: data.frame,
    });

    texture.source.scaleMode = "linear";
    data.container.destroy({ children: true });

    this.cache.set(data.name, texture);
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
    this.generators.delete(key);
  }

  clear() {
    this.cache.forEach((tex) => tex.destroy(true));
    this.cache.clear();
  }
}
