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
  private cache = new Map<string, { texture: Texture; src: string }>();
  private generators = new Map<string, TextureGenerator>();
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  async loadTexture(
    key: string,
    url: string,
  ): Promise<{ texture: Texture; src: string }> {
    if (this.cache.has(key)) return this.cache.get(key)!;

    const texture = await Assets.load(url);
    this.cache.set(key, texture);
    return texture;
  }

  async registerTexture(key: string, texture: Texture) {
    const src = await this.renderer.extract.base64(texture);
    this.cache.set(key, { texture, src });
  }

  async createTexture(generators: TextureGenerator[] | TextureGenerator) {
    if (!Array.isArray(generators)) {
      generators = [generators];
    }
    for (const generator of generators) {
      const data = generator();
      this.generators.set(data.name, generator);
      await this.generateAndCache(data);
    }
  }

  async registerEntity(entity: createTextureConstructor) {
    if (entity.loadTextures) await this.createTexture(entity.loadTextures());
  }

  async reloadTexture(key: string) {
    const generator = this.generators.get(key);

    if (!generator) {
      throw new Error(`No generator callback found for texture: "${key}"`);
    }
    const oldTexture = this.cache.get(key);
    if (oldTexture) {
      oldTexture.texture.destroy(true);
    }
    const newData = generator();
    return await this.generateAndCache(newData);
  }

  private async generateAndCache(data: TextureData) {
    const texture = this.renderer.generateTexture({
      target: data.container,
      resolution: data.resolution,
      frame: data.frame,
    });

    texture.source.scaleMode = "linear";
    data.container.destroy({ children: true });
    const src = await this.renderer.extract.base64(texture);
    this.cache.set(data.name, { texture, src });
    return { texture, src };
  }

  get(key: string) {
    const data = this.cache.get(key);
    if (!data) {
      throw new Error(`Texture "${key}" not found`);
    }

    return data;
  }

  unload(key: string) {
    const data = this.cache.get(key);
    if (data) {
      const { texture } = data;
      texture.destroy(true);
      this.cache.delete(key);
    }
    this.generators.delete(key);
  }

  clear() {
    this.cache.forEach((tex) => tex.texture.destroy(true));
    this.cache.clear();
  }
}
