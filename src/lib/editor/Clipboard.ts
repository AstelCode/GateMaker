import type { AppEntity } from "./App";
import { Vector, type World } from "./core";
import {
  NodeRegister,
  NodeEntity,
  Wire,
  type NodeJson,
  type WireJson,
} from "./entities";

export class ClipboardManager {
  current?: (NodeJson | WireJson)[];
  startPosition!: { x: number; y: number };

  constructor(private world: World) {
    this.current = [];
  }

  async hasData(): Promise<boolean> {
    const text = await navigator.clipboard.readText();
    return text.length > 0;
  }

  async copy(
    data: (NodeJson | WireJson)[],
    position: { x: number; y: number },
  ) {
    const payload = {
      position,
      data,
    };
    await this.setClipboard(JSON.stringify(payload));
  }

  async setClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async getClipboard() {
    const text = await navigator.clipboard.readText();
    return JSON.parse(text);
  }

  static createNodes(
    data: (NodeJson | WireJson)[],
    world: World,
    dx: number,
    dy: number,
  ) {
    const items: AppEntity[] = [];
    const mem = new Map<string, AppEntity>();
    const wires: WireJson[] = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item) {
        if (item.type == "gate") {
          const node = NodeRegister.get(item.name)!;
          world.addChild(node);
          node.position.set(item.position.x, item.position.y);
          mem.set(item.id, node);
          node.setFromJson(item);
          items.push(node);
        }
        if (item.type == "wire") {
          wires.push(item);
        }
      }
    }
    for (let i = 0; i < wires.length; i++) {
      const wireJson = wires[i];
      const startNode = mem.get(wireJson.startId)! as NodeEntity;
      const { info: startInfo, posititon: startPos } = startNode.getConnector(
        wireJson.startPin,
      );
      const endNode = mem.get(wireJson.endId)! as NodeEntity;
      const { info: endInfo, posititon: endPos } = endNode.getConnector(
        wireJson.endPin,
      );
      const wire = new Wire();
      world.addChild(wire);

      wire.startWire(
        startNode,
        wireJson.startPin,
        startPos,
        startInfo.direction,
        startInfo.size,
      );
      wire.endWire(endNode, wireJson.endPin, endPos, endInfo.direction, false);
      wire.setFromJson(wireJson);
      wire.forceLayoutUpdate();
      items.push(wire);
    }

    items.forEach((item) => {
      if (item instanceof NodeEntity) {
        item.position.x += dx;
        item.position.y += dy;
        NodeEntity.adjustPos(item);
      }
      if (item instanceof Wire) {
        item.translate(dx, dy);
        item.adjustPathToGrid();
        item.forceLayoutUpdate();
      }
    });
  }

  async pase(position: { x: number; y: number }) {
    try {
      const clipboard = await this.getClipboard();
      this.current = clipboard.data;
      this.startPosition = clipboard.position;
      if (!this.current || this.current.length == 0) return;
      const delta = new Vector(position).subtract(this.startPosition);
      ClipboardManager.createNodes(this.current, this.world, delta.x, delta.y);
      /*  const items: AppEntity[] = [];
      const mem = new Map<string, AppEntity>();
      const wires: WireJson[] = [];
      for (let i = 0; i < this.current.length; i++) {
        const item = this.current[i];
        if (item) {
          if (item.type == "gate") {
            const node = NodeRegister.get(item.name)!;
            this.world.addChild(node);
            node.position.set(item.position.x, item.position.y);
            mem.set(item.id, node);
            node.setFromJson(item);
            items.push(node);
          }
          if (item.type == "wire") {
            wires.push(item);
          }
        }
      }
      for (let i = 0; i < wires.length; i++) {
        const wireJson = wires[i];
        const startNode = mem.get(wireJson.startId)! as NodeEntity;
        const { info: startInfo, posititon: startPos } = startNode.getConnector(
          wireJson.startPin,
        );
        const endNode = mem.get(wireJson.endId)! as NodeEntity;
        const { info: endInfo, posititon: endPos } = endNode.getConnector(
          wireJson.endPin,
        );
        const wire = new Wire();
        this.world.addChild(wire);

        wire.startWire(
          startNode,
          wireJson.startPin,
          startPos,
          startInfo.direction,
          startInfo.size,
        );
        wire.endWire(
          endNode,
          wireJson.endPin,
          endPos,
          endInfo.direction,
          false,
        );
        wire.setFromJson(wireJson);
        wire.forceLayoutUpdate();
        items.push(wire);
      }

      const delta = new Vector(position).subtract(this.startPosition);
      items.forEach((item) => {
        if (item instanceof NodeEntity) {
          item.position.x += delta.x;
          item.position.y += delta.y;
          NodeEntity.adjustPos(item);
        }
        if (item instanceof Wire) {
          item.translate(delta.x, delta.y);
          item.adjustPathToGrid();
          item.forceLayoutUpdate();
        }
      }); */
    } catch (e) {
      console.log(e);
    }
  }
}
