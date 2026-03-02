import { Point } from "pixi.js";
import {
  type EngineMouseEvent,
  Entity,
  type Context,
  MouseButton,
  mergeBound,
} from "../../../../core";
import { NodeEntity } from "../../../entities/NodeEntity";
import type { Tool } from "../Tools";
import type { AppEvents, AppProviders } from "../../App";
import { Wire } from "../../../entities/Wire";
import { SelectionBox } from "../../../entities/SelectionBox";
import type { Grid } from "../../../entities/Grid";

export class SelectionTool implements Tool {
  keep: boolean = false;
  name: string = "selection";
  priority: number = 0;
  context!: Context<AppProviders, AppEvents>;

  box!: SelectionBox;

  selected: boolean = false;
  selectedGroup: boolean = false;
  draggingGroup: boolean = false;

  hits: Entity[] = [];
  selectedNodes: NodeEntity[] = [];
  selectedWires: Wire[] = [];

  activeWires: Set<Wire> = new Set();
  bothSelectedWires: Set<Wire> = new Set();
  connectedNodes: Set<NodeEntity> = new Set();

  IsValid(e: EngineMouseEvent, hit?: Entity): boolean {
    if (e.button !== MouseButton.LEFT) return false;
    if (!hit) return true;

    if (hit instanceof NodeEntity) {
      const result = hit.testHit(new Point(e.wX, e.wY));
      return result?.type === "box";
    }

    return false;
  }

  IsUnlock(): boolean {
    return !this.selected && !this.selectedGroup;
  }

  findSelection(): Entity[] {
    if (!this.box) return [];
    const selection: Entity[] = [];
    for (let i = this.context.world.children.length - 1; i >= 0; i--) {
      const child = this.context.world.children[i];
      if (child instanceof Entity && child !== this.box) {
        const bound = child.getSelectionBounds();
        if (!bound) continue;
        if (this.box.collide(bound)) {
          selection.push(child);
        }
      }
    }
    return selection;
  }

  init(): void {
    this.box = new SelectionBox();
    this.context.world.addChild(this.box);
  }

  private clearSelection(): void {
    this.selected = false;
    this.selectedGroup = false;
    this.draggingGroup = false;
    this.hits = [];

    this.selectedNodes.length = 0;
    this.selectedWires.length = 0;
    this.activeWires.clear();
    this.bothSelectedWires.clear();

    this.box.clearBox();
  }

  private cacheSelection(entities: Entity[]) {
    this.selectedNodes.length = 0;
    this.selectedWires.length = 0;
    this.activeWires.clear();
    this.bothSelectedWires.clear();

    for (const e of entities) {
      if (e instanceof NodeEntity) {
        this.selectedNodes.push(e);
      } else if (e instanceof Wire) {
        this.selectedWires.push(e);
      }
    }

    for (const node of this.selectedNodes) {
      const connectedWires = node.getConnectedWires
        ? node.getConnectedWires()
        : [];
      for (const w of connectedWires) {
        this.activeWires.add(w);
      }
    }

    const nodeSet = new Set(this.selectedNodes);
    for (const wire of this.selectedWires) {
      if (
        wire.startNode &&
        wire.endNode &&
        nodeSet.has(wire.startNode) &&
        nodeSet.has(wire.endNode)
      ) {
        this.bothSelectedWires.add(wire);
        this.connectedNodes.add(wire.startNode);
        this.connectedNodes.add(wire.endNode);
      }
    }
  }

  onDown(e: EngineMouseEvent, hit?: Entity): void {
    if (this.selectedGroup && this.hits.length > 0) {
      if (this.box.inside(e.wX, e.wY)) {
        this.draggingGroup = true;
        return;
      } else {
        this.clearSelection();
        this.context.events.emit("restoreTool");
      }
    }

    if (!hit) {
      this.clearSelection();
      this.box.setStartPoint(new Point(e.wX, e.wY));
      return;
    }

    if (hit instanceof SelectionBox || hit instanceof Wire) return;

    this.selected = true;
    this.draggingGroup = true;
    this.selectedGroup = true;
    this.hits = [hit];

    this.cacheSelection(this.hits);

    const bounds = hit.getSelectionBounds();
    if (!bounds) return;
    this.box.fromBounding(bounds);
  }

  onDrag(e: EngineMouseEvent): void {
    if (this.draggingGroup) {
      // 1. Mover Nodos
      for (const node of this.selectedNodes) {
        node.position.x += e.wDx;
        node.position.y += e.wDy;
        if (!this.connectedNodes.has(node)) {
          node.updateWires();
        }
      }

      // 2. Mover Cables completamente seleccionados (sin ruta inteligente)
      for (const wire of this.bothSelectedWires) {
        wire.move(e.wDx, e.wDy);
      }

      // 3. Estirar visualmente los cables conectados a los nodos movidos
      for (const wire of this.activeWires) {
        if (!this.bothSelectedWires.has(wire)) {
          wire.updateLastSegments();
          wire.fixDiagonalSegments(); // Mantiene ángulos rectos visualmente
        }
      }

      this.box.drag(e.wDx, e.wDy);
      return;
    }

    if (!this.selected && !this.selectedGroup) {
      this.box.setLastPoint(new Point(e.wX, e.wY));
    }
  }

  onUp(e: EngineMouseEvent): void {
    if (this.draggingGroup) {
      const grid = this.context.provider.get("grid") as Grid;

      // 1. Ajustar Nodos (su snapPos ahora actualiza el grid espacial)
      for (const node of this.selectedNodes) {
        node.snapPos?.();
        if (!this.connectedNodes.has(node)) {
          node.updateWires();
        }
      }
      //
      //// 2. Cables que se movieron por completo
      for (const wire of this.bothSelectedWires) {
        wire.snapPos?.();
      }
      for (const wire of this.activeWires) {
        wire.snapPos();
      }
      //// 3. --- NUEVO: Cables enrutados (A*) ---
      //// Aquellos cables que sólo estiramos visualmente, ahora recalculan su ruta final
      //for (const wire of this.activeWires) {
      //  if (!this.bothSelectedWires.has(wire)) {
      //    wire.snapPos();
      //  }
      //}

      const bound = mergeBound(this.hits);
      this.box.fromBounding(bound);
      this.draggingGroup = false;
      return;
    }

    if (!this.selected && !this.selectedGroup) {
      const selection = this.findSelection();

      if (selection.length > 0) {
        this.selectedGroup = true;
        this.hits = selection;

        this.cacheSelection(this.hits);
        this.hits = selection.filter((item) => {
          if (item instanceof Wire) {
            return this.bothSelectedWires.has(item);
          }
          return true;
        });

        const bound = mergeBound(this.hits);
        this.box.fromBounding(bound);
      } else {
        this.clearSelection();
      }
    }
  }

  onOutside(e: EngineMouseEvent): void {
    this.onUp(e);
  }
}
