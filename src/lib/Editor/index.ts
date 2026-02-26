import { App } from "./App";

export interface AppInfo {
  engine: App;
}

export async function createApp(container: HTMLElement): Promise<AppInfo> {
  const engine = new App(container);
  await engine.init();
  return { engine };
}

export function destroyApp(info: AppInfo) {
  info.engine.destroy();
}
