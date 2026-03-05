import type { AppEntity, AppEngineContext } from "../../App";
import {
  MouseButton,
  Vector,
  type EngineContext,
  type EngineMouseEvent,
  type Entity,
} from "../../core";
import { Wire } from "../../entities/Wire";
import type { Tool } from "../ToolManager";

export class EditWireTool implements Tool {
  name = "edit-wire";
  priority = 1;
  keep = true;
  context!: AppEngineContext;
  pos!: Vector;
  hit?: Wire;
  segmentIdx!: number;

  IsValid(e: EngineMouseEvent, hit?: AppEntity): boolean {
    return hit instanceof Wire && e.button == MouseButton.LEFT;
  }

  IsUnlock(e: EngineMouseEvent, hit?: AppEntity): boolean {
    return false;
  }

  onDown(e: EngineMouseEvent, hit?: AppEntity): void {
    const isWire = hit instanceof Wire;
    if (!isWire || (isWire && e.button == MouseButton.RIGHT)) {
      this.context.tools.restore();
      return;
    }
    this.hit = hit!;
    this.segmentIdx = hit.getSegment(new Vector(e.wX, e.wY));
    this.context.mouse.cursor = "pointer";
  }

  onDrag(e: EngineMouseEvent): void {
    if (!this.hit) return;
    this.hit?.moveSegment(this.segmentIdx, new Vector(e.wDx, e.wDy));
  }

  onUp(e: EngineMouseEvent): void {
    if (!this.hit) return;
    this.context.mouse.cursor = "default";
    this.hit.adjustSegment(this.segmentIdx);
    this.context.tools.use("selection");
    this.hit = undefined;
  }
}
