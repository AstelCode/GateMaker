import {
  Engine,
  type DefaultEvents,
  type DefaultProvider,
  type TextureData,
} from "../core";
import { Grid } from "./Grid";

interface Providers {
  //camera: Camera;
  //grid: Grid;
  //tools: Tools;
}
interface Events {
  restoreTool: any;
}
export type AppProviders = Providers & DefaultProvider;
export type AppEvents = Events & DefaultEvents;
export class App extends Engine<Providers, AppEvents> {
  grid!: Grid;
  protected onCreate(): void {
    const context = this.createContext();
    this.grid = new Grid();
    this.grid.init(context);
    this.root.addChild(this.grid.getSprite());
  }

  protected async onInitTextures(): Promise<void> {
    const textures: TextureData[] = [];
    textures.push(...Grid.loadTextures());
    for (const data of textures) {
      this.assets.createTexture(data);
    }
  }

  protected onUpdate(delta: number): void {}
}
