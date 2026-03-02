import { Log } from "../utils/Log";

type ProviderFunc<R> = () => R;

export class Provider<RequestMap = any> {
  private providers: Map<keyof RequestMap, ProviderFunc<any>> = new Map();

  public send<K extends keyof RequestMap>(
    name: K,
    provider: ProviderFunc<RequestMap[K]>,
  ): () => void {
    this.providers.set(name, provider);

    return () => {
      if (this.providers.get(name) === provider) {
        this.providers.delete(name);
      }
    };
  }

  public get<K extends keyof RequestMap>(name: K): RequestMap[K] | undefined {
    const provider = this.providers.get(name) as
      | (() => RequestMap[K])
      | undefined;

    if (provider) {
      return provider();
    }

    Log.error("EventEmitter", `Provider don't exits: ${String(name)}`);
    return undefined;
  }

  public clear(): void {
    this.providers.clear();
  }
}
