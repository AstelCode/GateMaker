import {
  AABB,
  Entity,
  MouseButton,
  Vector,
  type EngineMouseEvent,
} from "../../core";
import type { Tool } from "../ToolManager";
import type { AppEntity, AppEngineContext } from "../../App";
import { NodeEntity } from "../../entities/NodeEntity";
import { SelectionBox } from "../../entities/SelectionBox";
import { Wire } from "../../entities/Wire";
import type { Container } from "pixi.js";

export class SelectionTool implements Tool {
  priority: number = 0;
  context!: AppEngineContext;
  name = "selection";
  lock = false;
  keep = true;
  box!: SelectionBox;

  selection!: AppEntity[];

  active = false;
  draggingSelection = false;
  wireSelectionOnly = false;
  lastMouse!: Vector;
  isWire!: boolean;

  selectedNodes: NodeEntity[] = [];
  selectedWires: Wire[] = [];
  activeWires = new Map<string, Wire>();
  bothSelectedWires: Set<Wire> = new Set();

  activeWire?: Wire;

  //#region block tools
  IsValid(e: EngineMouseEvent, hit?: AppEntity): boolean {
    if (hit instanceof Wire && e.button == MouseButton.RIGHT) return true;
    if (e.button == MouseButton.MIDDLE) return false;
    if (!hit) return true;
    if (hit instanceof NodeEntity) {
      const result = hit.testHit(new Vector(e.wX, e.wY));
      return result?.type === "box";
    }

    return false;
  }

  IsUnlock(e: EngineMouseEvent, hit?: AppEntity): boolean {
    return false;
  }
  //#endregion

  init(): void {
    this.box = new SelectionBox();
    this.context.world.addChild(this.box);
    this.lastMouse = new Vector();
    this.selection = [];
  }

  reset(): void {
    this.box.clear();
    this.active = false;
    this.selection.length = 0;
    this.draggingSelection = false;
  }

  findSelection(): AppEntity[] {
    if (!this.box) return [];
    let selection: AppEntity[] = [];
    const nodeMen = new Set<NodeEntity>();
    for (let i = this.context.world.children.length - 1; i >= 0; i--) {
      const child = this.context.world.children[i];
      if (child instanceof Entity) {
        const bound = child.bounding;
        if (!bound) continue;
        if (AABB.containsAABB(this.box.bounding, bound)) {
          if (child instanceof NodeEntity) {
            nodeMen.add(child);
          }
          selection.push(child);
        }
      }
    }

    if (nodeMen.size > 0) {
      selection = selection.filter((item) => {
        if (item instanceof Wire) {
          if (
            nodeMen.has(item.startNode.node) &&
            nodeMen.has(item.endNode.node)
          ) {
            return true;
          }
          return false;
        }
        return true;
      });
    }

    return selection;
  }

  updateContextMenu(hit: Container | undefined, p: Vector) {
    if (!hit) {
      this.context.events.emit("setContextMenu", [
        { id: "add", name: "Add Node", data: { x: p.x, y: p.y } },
      ]);
    }
    if (hit instanceof NodeEntity) {
      this.context.events.emit("setContextMenu", [
        {
          id: "delete",
          name: "Delete",
          color: "red",
          data: [hit],
        },
      ]);
    }
    if (hit instanceof Wire) {
      this.context.events.emit("setContextMenu", [
        { id: "route", name: "Route", data: [hit] },
        { id: "delete", name: "Delete", color: "red", data: [hit] },
      ]);
    }
    if (hit instanceof SelectionBox) {
      if (this.selection.find((item) => item instanceof NodeEntity)) {
        this.context.events.emit("setContextMenu", [
          {
            id: "delete",
            name: "Delete",
            color: "red",
            data: this.selection.slice(),
          },
        ]);
      } else {
        this.context.events.emit("setContextMenu", [
          {
            id: "route",
            name: "Route",
            data: this.selection.slice(),
          },
          {
            id: "delete",
            name: "Delete",
            color: "red",
            data: this.selection.slice(),
          },
        ]);
      }
    }
  }

  onDown(e: EngineMouseEvent, hit?: AppEntity): void {
    const v = new Vector(e.wX, e.wY);
    if (e.button == MouseButton.RIGHT) {
      this.context.events.emit("openContextMenu", { x: e.vX, y: e.vY });
    } else {
      this.context.events.emit("closeModal");
    }

    if (this.active && this.box.bounding.pointInside(v) && !this.isWire) {
      if (e.button == MouseButton.RIGHT) {
        this.updateContextMenu(this.box, new Vector(e.wX, e.wY));
      }
      this.draggingSelection = true;
      this.lastMouse.set(v);
      this.cacheSelection();
      return;
    }

    if (hit instanceof Wire && e.button == MouseButton.LEFT) {
      this.active = false;
      this.draggingSelection = false;
      this.box.clear();
      this.context.tools.use("edit-wire"); //* important
      this.context.tools.callDown(e, hit); //* important
      return;
    }

    if (hit) {
      if (hit instanceof NodeEntity) {
        const test = hit.testHit(new Vector(e.wX, e.wY));
        if (test?.type == "connector") {
          this.reset();
          this.context.tools.use("create-wire");
          this.context.tools.callDown(e, hit);
          return;
        }
      }

      this.updateContextMenu(hit, new Vector(e.wX, e.wY));
      this.selection.length = 0;
      this.selection.push(hit);
      this.box.calcBounding([hit]);
      this.active = true;
      this.isWire = hit instanceof Wire;

      if (this.activeWire && hit != this.activeWire) {
        this.activeWire.unSelect();
      }
      if (hit instanceof Wire) {
        this.activeWire = hit;
        hit.select();
      }
      this.draggingSelection = !this.isWire;
      this.context.mouse.cursor = "pointer";
      this.wireSelectionOnly = this.isWire;
      this.lastMouse.set(v);
      this.cacheSelection();
      return;
    }

    for (const item of this.selection) {
      if (item instanceof Wire) {
        item.unSelect();
      }
    }
    if (this.activeWire) {
      this.activeWire.unSelect();
      this.activeWire = undefined;
    }
    this.updateContextMenu(undefined, new Vector(e.wX, e.wY));
    this.active = false;
    this.draggingSelection = false;
    this.isWire = false;
    this.wireSelectionOnly = false;
    this.selectedNodes.length = 0;
    this.selectedWires.length = 0;
    this.box.setStart(v);
  }

  onDrag(e: EngineMouseEvent): void {
    if (e.button !== MouseButton.LEFT) return;
    const v = new Vector(e.wX, e.wY);
    if (this.wireSelectionOnly) {
      if (this.wireSelectionOnly) {
        this.context.tools.restore();
        return;
      }

      this.wireSelectionOnly = false;
      this.active = false;
      this.draggingSelection = false;
      return;
    }
    if (!this.draggingSelection) {
      this.box.setEnd(v);
      return;
    }

    const dx = v.x - this.lastMouse.x;
    const dy = v.y - this.lastMouse.y;
    const delta = v.clone().subtract(this.lastMouse);
    if (delta.x === 0 && delta.y === 0) return;

    for (const wire of this.bothSelectedWires) {
      wire.translate(dx, dy);
    }

    for (const node of this.selectedNodes) {
      node.position.x += delta.x;
      node.position.y += delta.y;
      node.forceLayoutUpdate();
    }

    for (const wire of this.activeWires.values()) {
      if (!this.bothSelectedWires.has(wire)) {
        wire.updateLastSegments();
        wire.fixDiagonalSegments();
        wire.forceLayoutUpdate();
      }
    }

    this.box.position.x += delta.x;
    this.box.position.y += delta.y;

    this.lastMouse.set(v);
  }

  onUp(e: EngineMouseEvent): void {
    if (e.button !== MouseButton.LEFT) return;
    //this.context.mouse.cursor = "default";

    this.box.updateBounding();

    if (this.draggingSelection) {
      for (const node of this.selectedNodes) {
        NodeEntity.adjustPos(node);
        node.forceLayoutUpdate();
      }

      for (const item of this.activeWires) {
        item[1].adjustPathToGrid();
        item[1].updateLastSegments();
        item[1].forceLayoutUpdate();
      }

      this.activeWires.clear();
      this.box.calcBounding(this.selection);
    }

    if (this.wireSelectionOnly) {
      this.box.calcBounding(this.selection);
      return;
    }

    if (!this.draggingSelection) {
      for (const item of this.selection)
        if (item instanceof Wire) item.unSelect();

      this.selection.length = 0;
      this.selection = this.findSelection();
      this.box.clear();

      if (this.selection.length === 0) {
        this.context.tools.restore();
        this.active = false;
      } else {
        this.active = true;
        for (const item of this.selection)
          if (item instanceof Wire) item.select();
        this.box.calcBounding(this.selection);
      }
    }

    this.draggingSelection = false;
  }

  onOutside(e: EngineMouseEvent): void {
    //e.button = MouseButton.LEFT;
    //this.onUp(e);
  }

  private cacheSelection() {
    this.selectedNodes.length = 0;
    this.selectedWires.length = 0;
    this.activeWires.clear();
    this.bothSelectedWires.clear();

    for (const e of this.selection) {
      if (e instanceof NodeEntity) {
        this.selectedNodes.push(e);
      } else if (e instanceof Wire) {
        this.selectedWires.push(e);
      }
    }

    for (const node of this.selectedNodes) {
      for (const w of node.getConnectedWires()) {
        if (!this.activeWires.has(w.id)) {
          this.activeWires.set(w.id, w);
        }
      }
    }

    const nodeSet = new Set(this.selectedNodes);
    for (const wire of this.selectedWires) {
      if (nodeSet.has(wire.startNode.node) && nodeSet.has(wire.endNode.node)) {
        this.bothSelectedWires.add(wire);
      }
    }
  }
  destroy(): void {
    this.context.world.removeChild(this.box);
  }
}
