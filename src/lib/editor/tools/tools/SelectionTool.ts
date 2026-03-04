import {
  AABB,
  Entity,
  MouseButton,
  Vector,
  type EngineContext,
  type EngineMouseEvent,
} from "../../core";
import type { AppProviders, AppEvents, AppContext } from "../../App";
import { NodeEntity } from "../../entities/NodeEntity";
import { SelectionBox } from "../../entities/SelectionBox";
import type { Tool } from "../../toolManager/ToolManager";

export class SelectionTool implements Tool {
  priority: number = 0;
  context!: EngineContext<AppProviders, AppEvents, AppContext>;
  name = "selection";
  lock = true;
  keep = true;
  box!: SelectionBox;

  selection!: Entity[];

  active = false;
  draggingSelection = false;
  lastMouse!: Vector;
  isWire!: boolean;

  selectedNodes: NodeEntity[] = [];
  //selectedWires: Wire[] = [];
  //activeWires = new Map<string, Wire>();
  //bothSelectedWires: Set<Wire> = new Set();

  //#region block tools
  IsValid(e: EngineMouseEvent, hit?: Entity): boolean {
    if (e.button !== MouseButton.LEFT) return false;
    if (!hit) return true;

    if (hit instanceof NodeEntity) {
      const result = hit.testHit(new Vector(e.wX, e.wY));
      return result?.type === "box";
    }

    return false;
  }

  IsUnlock(e: EngineMouseEvent, hit?: Entity): boolean {
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
    this.active = false;
    this.selection.length = 0;
    this.draggingSelection = false;
  }

  findSelection(): Entity[] {
    if (!this.box) return [];
    const selection: Entity[] = [];
    for (let i = this.context.world.children.length - 1; i >= 0; i--) {
      const child = this.context.world.children[i];
      if (child instanceof Entity) {
        const bound = child.bounding;
        if (!bound) continue;
        if (AABB.collideAABB(bound, this.box.bounding)) {
          selection.push(child);
        }
      }
    }
    return selection;
  }

  onDown(e: EngineMouseEvent, hit?: Entity): void {
    if (e.button != MouseButton.LEFT) return;
    const v = new Vector(e.wX, e.wY);
    if (this.active && this.box.bounding.pointInside(v) && !this.isWire) {
      this.draggingSelection = true;
      this.context.root.cursor = "pointer";
      this.lastMouse.set(v);
      this.cacheSelection();
      return;
    }

    if (hit) {
      this.selection.length = 0;
      this.selection.push(hit);
      this.box.calcBounding([hit]);
      //this.box.set(hit.getAABB());
      //this.box.addPadding(this.padding);
      this.active = true;

      //this.isWire = hit instanceof Wire;
      this.draggingSelection = !this.isWire;
      this.context.root.cursor = "pointer";
      //this.wireSelectionOnly = this.isWire;
      this.lastMouse.set(v);
      this.cacheSelection();

      return;
    }

    this.active = false;
    this.draggingSelection = false;
    this.isWire = false;
    // this.wireSelectionOnly = false;
    this.selectedNodes.length = 0;
    //this.selectedWires.length = 0;
    //this.start.set(v);
    //this.end.set(v.clone());
    //this.box.setFromTwoPoints(this.start, this.end);
    this.box.setStart(v);
  }

  onDrag(e: EngineMouseEvent): void {
    if (e.button !== MouseButton.LEFT) return;
    const v = new Vector(e.wX, e.wY);
    if (this.draggingSelection) {
      this.context.root.cursor = "pointer";
    }
    //if (this.wireSelectionOnly) {
    //  if (this.wireSelectionOnly) {
    //    AppEvents.emit("changeTool", { name: "edit_wire" });
    //    AppEvents.get("tools")?.current?.onDown?.(e, this.out[0]);
    //    return;
    //  }
    //
    //  this.wireSelectionOnly = false;
    //  this.active = false;
    //  this.draggingSelection = false;
    //  this.start.set(this.lastMouse);
    //  this.end.set(v);
    //  this.box.setFromTwoPoints(this.start, this.end);
    //  return;
    //}
    if (!this.draggingSelection) {
      this.box.setEnd(v);
      /*       this.end.set(v);
      this.box.setFromTwoPoints(this.start, this.end); */
      return;
    }

    //const dx = v.x - this.lastMouse.x;
    //const dy = v.y - this.lastMouse.y;
    const delta = v.clone().subtract(this.lastMouse);
    if (delta.x === 0 && delta.y === 0) return;

    //for (const wire of this.bothSelectedWires) {
    //  wire.translate(dx, dy);
    //}

    for (const node of this.selectedNodes) {
      node.position.x += delta.x;
      node.position.y += delta.y;
      node.markDirty();
    }

    //for (const wire of this.activeWires.values()) {
    //  if (!this.bothSelectedWires.has(wire)) {
    //    wire.updateLastSegments();
    //    wire.fixDiagonalSegments();
    //  }
    //}

    this.box.position.x += delta.x;
    this.box.position.y += delta.y;

    this.lastMouse.set(v);
  }

  onUp(e: EngineMouseEvent): void {
    if (e.button !== MouseButton.LEFT) return;
    this.context.root.cursor = "default";

    this.box.updateBounding();

    if (this.draggingSelection) {
      // Snap nodes
      for (const node of this.selectedNodes) {
        //Grid.snap(node.position);
        NodeEntity.adjustPos(node);
        node.forceLayoutUpdate();
        // this.grid.registerEntity?.(node);
      }
      //for (const item of this.activeWires) {
      //  item[1].adjustPathToGrid();
      //  item[1].updateLastSegments();
      //}
      //this.activeWires.clear();
      this.box.calcBounding(this.selection);

      //this.box.set(Entity.calcBounding(this.out));
      //this.box.addPadding(this.padding);
    }

    // Selection finalize
    if (!this.draggingSelection) {
      this.selection.length = 0;
      this.selection = this.findSelection();
      //Entity.collect(this.root, this.out, (item) =>
      //  this.box.containsAABB(item.getAABB()),
      //);
      this.box.clear();

      if (this.selection.length === 0) {
        // AppEvents.emit("unLockTool");
        //this.unLock();
        this.context.events.emit("restoreTool");
        this.active = false;
      } else {
        this.active = true;
        this.box.calcBounding(this.selection);
        //this.box.set(Entity.calcBounding(this.out));
        //this.box.addPadding(this.padding);
      }
    }

    this.draggingSelection = false;
  }

  onOutside(e: EngineMouseEvent): void {
    e.button = MouseButton.LEFT;
    this.onUp(e);
  }

  private cacheSelection() {
    this.selectedNodes.length = 0;
    //this.selectedWires.length = 0;
    //this.activeWires.clear();
    //this.bothSelectedWires.clear();

    for (const e of this.selection) {
      if (e instanceof NodeEntity) {
        this.selectedNodes.push(e);
      } /*  else if (e instanceof Wire) {
        this.selectedWires.push(e);
      } */
    }

    // Cache connected wires (NO hide here)
    /* for (const node of this.selectedNodes) {
      for (const w of node.getConnectedWires()) {
        if (!this.activeWires.has(w.id)) {
          this.activeWires.set(w.id, w);
        }
      }
    } */

    /*   const nodeSet = new Set(this.selectedNodes);
    for (const wire of this.selectedWires) {
      if (nodeSet.has(wire.startNode) && nodeSet.has(wire.endNode)) {
        this.bothSelectedWires.add(wire);
      }
    } */
  }
}
