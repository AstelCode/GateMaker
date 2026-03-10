import type { AppEntity } from "./App";
import { Vector, type World } from "./core";
import { NodeEntity, Wire, type NodeJson, type WireJson } from "./entities";
import { NodeRegister } from "./NodeRegister";

export class ClipboardManager {
  current?: (NodeJson | WireJson)[];
  startPosition!: { x: number; y: number };

  constructor(private world: World) {
    this.current = [];
  }

  hasData() {
    return this.current && this.current?.length > 0;
  }

  copy(data: (NodeJson | WireJson)[], position: { x: number; y: number }) {
    this.current = data;
    this.startPosition = position;
  }

  pase(position: { x: number; y: number }) {
    if (!this.current || this.current.length == 0) return;
    const items: AppEntity[] = [];
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
      wire.endWire(endNode, wireJson.endPin, endPos, endInfo.direction, false);
      wire.points.length = 0;
      wire.setPath(wireJson.path.map((item) => item.clone()));
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
    });
  }
}
