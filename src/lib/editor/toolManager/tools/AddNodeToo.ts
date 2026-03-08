import type { AppEngineContext, AppEntity } from "../../App";
import { MouseButton, type EngineMouseEvent, type Entity } from "../../core";
import { NodeEntity } from "../../entities";
import type { Tool } from "../ToolManager";

export class AddNodeTool implements Tool {
  name: string = "add-node";
  priority: number = 6;
  keep?: boolean | undefined;
  context!: AppEngineContext;

  active: boolean = false;
  hit?: NodeEntity;

  IsValid(): boolean {
    return this.active;
  }

  IsUnlock(): boolean {
    return false;
  }

  onMove(e: EngineMouseEvent): void {
    if (!this.hit) return;
    this.hit.visible = true;
    this.hit.position.x = e.wX;
    this.hit.position.y = e.wY;
    this.hit.forceLayoutUpdate();
  }

  onDown(e: EngineMouseEvent): void {
    if (e.button != MouseButton.LEFT) return;
    if (!this.hit) return;
    NodeEntity.adjustPos(this.hit);
    this.hit.unSelect();
    this.hit.forceLayoutUpdate();
    this.context.tools.restore();
    this.active = false;
    this.hit = undefined;
  }
}
