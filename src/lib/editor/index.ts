import { App } from "./src/App";

export interface AppInfo {
  engine: App;
}

export async function createApp(container: HTMLElement): Promise<AppInfo> {
  await document.fonts.load('10pt "CascadiaMono"');
  await document.fonts.ready;
  const engine = new App(container);
  await engine.create();

  return { engine };
}

export function destroyApp(info: AppInfo) {
  info.engine.destroy();
}
