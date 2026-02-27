import { Point } from "pixi.js";
import type { AppProviders, AppEvents } from "../../App";
import {
  MouseButton,
  type Context,
  type EngineMouseEvent,
  type Entity,
} from "../../core";
import { NodeEntity } from "../../entities/NodeEntity";
import type { Tool } from "../Tools";
import { Wire } from "../../entities/Wire";
export class CreateWireTool implements Tool {
  lock: boolean = true;
  keep: boolean = false;
  name: string = "create-wire";
  context!: Context<AppProviders, AppEvents>;
  current?: Wire;

  init(context: Context<AppProviders, AppEvents>): void {
    this.context = context;
  }

  IsValid(e: EngineMouseEvent, hit: Entity): boolean {
    if (!(hit instanceof NodeEntity)) return false;
    const hitInsideNode = hit.testHit(new Point(e.wX, e.wY));
    if (!hitInsideNode || hitInsideNode.type != "connector") return false;
    return true;
  }

  onDown(e: EngineMouseEvent, hit?: Entity): void {
    if (e.button == MouseButton.LEFT) {
      if (hit instanceof NodeEntity) {
        const result = hit.testHit(new Point(e.wX, e.wY));
        if (result && result.type == "connector") {
          const p = new Point(result.x, result.y);
          if (!this.current) {
            this.current = new Wire();
            this.current.startWire(p, hit);
            this.context.world.addChild(this.current);
          } else {
            if (this.current.startNode.id != hit.id) {
              this.current.endWire(p, hit);
              this.current = undefined;
              this.context.events.emit("restoreTool");
            }
          }
        }
      } else if (hit instanceof Wire || !hit) {
        this.current!.addPoint(new Point(e.wX, e.wY));
      }
    }
    if (e.button == MouseButton.RIGHT) {
      if (this.current) {
        this.context.world.removeChild(this.current);
        delete this.current;
        this.current = undefined;
        this.context.events.emit("restoreTool");
      }
    }
  }

  onMove(e: EngineMouseEvent): void {
    if (this.current) {
      this.current.moveLastPoint(new Point(e.wX, e.wY));
    }
  }

  IsUnlock(e: EngineMouseEvent, hit: Entity): boolean {
    return false;
  }
}
