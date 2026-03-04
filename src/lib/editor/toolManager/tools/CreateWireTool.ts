import type { AppContext, AppEvents, AppProviders } from "../../App";
import {
  MouseButton,
  Vector,
  type EngineContext,
  type EngineMouseEvent,
  type Entity,
} from "../../core";
import { NodeEntity } from "../../entities/NodeEntity";
import { Wire } from "../../entities/Wire";
import type { Tool } from "../ToolManager";

export class CreateWireTool implements Tool {
  keep: boolean = false;
  name: string = "create-wire";
  priority: number = 1;
  context!: EngineContext<AppProviders, AppEvents, AppContext>;
  current?: Wire;
  completed: boolean = false;

  IsValid(e: EngineMouseEvent, hit: Entity): boolean {
    if (!(hit instanceof NodeEntity)) return false;
    const hitInsideNode = hit.testHit(new Vector(e.wX, e.wY));
    if (!hitInsideNode || hitInsideNode.type != "connector") return false;
    return true;
  }

  IsUnlock(e: EngineMouseEvent, hit: Entity): boolean {
    return this.completed;
  }

  onDown(e: EngineMouseEvent, hit?: Entity): void {
    if (e.button == MouseButton.LEFT) {
      if (hit instanceof NodeEntity) {
        const connector = hit.testHit(new Vector(e.wX, e.wY));
        const pos = new Vector(connector);

        if (connector && connector.type == "connector") {
          if (!this.current) {
            this.current = new Wire();
            this.current.startWire(
              hit,
              connector.name!,
              pos,
              connector.direction!,
            );
            this.context.world.addChild(this.current);
            this.completed = false;
          } else {
            if (this.current.startNode.node.id == hit.id) return;
            /*         if (
              !this.validConector(
                node,
                this.current,
                connector.name!,
                connector.connectorType!,
              )
            )
              return; */
            this.completed = true;
            this.current.endWire(
              hit,
              connector.name!,
              pos,
              connector.direction!,
            );
            //this.root.addChild(this.current);
            this.current.forceLayoutUpdate();
            this.current = undefined;
            this.context.events.emit("restoreTool");
          }
        }
      } else if (hit instanceof Wire || !hit) {
        if (this.current) {
          this.current!.addPoint(new Vector(e.wX, e.wY));
        }
      }
    } else {
      if (this.current) {
        this.context.world.removeChild(this.current);
        this.current.destroy(true);
        delete this.current;
        this.current = undefined;
        this.context.events.emit("restoreTool");
      }
    }
  }

  onMove(e: EngineMouseEvent): void {
    if (this.current) {
      this.current.moveLastPoint(new Vector(e.wX, e.wY));
    }
  }
}
