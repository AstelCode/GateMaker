type Listener<T> = (data: T) => void;

export class EventEmitter<EventMap> {
  private listeners: Map<keyof EventMap, Listener<any>[]> = new Map();

  public on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const list = this.listeners.get(event)!;
    list.push(listener);

    return () => this.off(event, listener);
  }

  public off<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    const list = this.listeners.get(event);
    if (!list) return;

    const index = list.indexOf(listener);
    if (index !== -1) {
      list.splice(index, 1);
    }

    if (list.length === 0) {
      this.listeners.delete(event);
    }
  }

  public emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): void {
    const list = this.listeners.get(event);
    if (!list) return;

    const runList = [...list];
    for (let i = 0; i < runList.length; i++) {
      runList[i](data!);
    }
  }

  public once<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    const wrapper = (data: EventMap[K]) => {
      this.off(event, wrapper);
      listener(data);
    };
    this.on(event, wrapper);
  }

  public clear(): void {
    this.listeners.clear();
  }
}
