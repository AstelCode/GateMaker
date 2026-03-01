import { Point } from "pixi.js";
import {
  type EngineMouseEvent,
  Entity,
  type Context,
  MouseButton,
  mergeBound,
} from "../../core";
import { NodeEntity } from "../../entities/NodeEntity";
import type { Tool } from "../Tools";
import type { AppEvents, AppProviders } from "../../App";
import { Wire } from "../../entities/Wire";
import { SelectionBox } from "../../entities/SelectionBox";

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
    this.box.clearBox();
  }

  onDown(e: EngineMouseEvent, hit?: Entity): void {
    if (this.selectedGroup && this.hits.length > 0) {
      if (this.box.inside(e.wX, e.wY)) {
        this.draggingGroup = true;
        return;
      } else {
        this.clearSelection();
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

    const bounds = hit.getSelectionBounds();
    if (!bounds) return;
    this.box.fromBounding(bounds);
  }

  onDrag(e: EngineMouseEvent): void {
    if (this.draggingGroup) {
      for (const entity of this.hits) {
        if (entity instanceof NodeEntity) {
          entity.position.x += e.wDx;
          entity.position.y += e.wDy;
        }
        if (entity instanceof Wire) {
          entity.move(e.wDx, e.wDy);
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
      for (const entity of this.hits) {
        if (entity instanceof NodeEntity) {
          entity.snapPos();
          entity.updateWires();
        }
      }

      for (const entity of this.hits) {
        if (entity instanceof Wire) {
          entity.snapPos();
        }
      }
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
        const bound = mergeBound(selection);
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
