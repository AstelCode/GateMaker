import type { AppEngineContext, AppEntity } from "../../App";
import { MouseButton, Vector, type EngineMouseEvent } from "../../core";
import {
  Wire,
  ConnectorType,
  NodeEntity,
  InputNode,
  OutputNode,
} from "../../entities";
import type { Tool } from "../ToolManager";

export class CreateWireTool implements Tool {
  keep: boolean = false;
  name: string = "create-wire";
  priority: number = 2;
  context!: AppEngineContext;
  current?: Wire;
  completed: boolean = false;

  IsValid(e: EngineMouseEvent, hit: AppEntity): boolean {
    if (!(hit instanceof NodeEntity)) return false;
    const hitInsideNode = hit.testHit(new Vector(e.wX, e.wY));
    if (!hitInsideNode || hitInsideNode.type != "connector") return false;
    return true;
  }

  IsUnlock(): boolean {
    return this.completed;
  }

  validConector(
    node: NodeEntity,
    wire: Wire,
    name: string,
    connectorType: ConnectorType,
    size: number,
  ) {
    const nodeConector = wire.startNode.node.getConnectorInfo(
      wire.startNode.pin,
    );

    if (nodeConector?.type == connectorType || !node.isValidConnector(name)) {
      return false;
    }

    if (
      node instanceof InputNode &&
      node.getConnectorSize() == -1 &&
      !(wire.startNode.node instanceof InputNode)
    ) {
      node.setConnectorSize(nodeConector.size);
      wire.size = nodeConector.size;
      return true;
    }
    if (
      wire.startNode.node instanceof InputNode &&
      wire.startNode.node.getConnectorSize() == -1 &&
      !(node instanceof InputNode)
    ) {
      wire.startNode.node.setConnectorSize(size);
      wire.size = size;
      return true;
    }

    if (
      node instanceof OutputNode &&
      node.getConnectorSize() == -1 &&
      !(wire.startNode.node instanceof OutputNode)
    ) {
      node.setConnectorSize(nodeConector.size);
      wire.size = nodeConector.size;
      return true;
    }
    if (
      wire.startNode.node instanceof OutputNode &&
      wire.startNode.node.getConnectorSize() == -1 &&
      !(node instanceof OutputNode)
    ) {
      wire.startNode.node.setConnectorSize(size);
      wire.size = size;
      return true;
    }
    if (size != wire.size) {
      return false;
    }
    return true;
  }

  onDown(e: EngineMouseEvent, hit?: AppEntity): void {
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
              hit.config.connectors[connector.name!].size,
            );
            this.context.world.addChild(this.current);
            this.completed = false;
          } else {
            if (this.current.startNode.node.id == hit.id) return;
            if (
              !this.validConector(
                hit,
                this.current,
                connector.name!,
                connector.connectorType!,
                hit.config.connectors[connector.name!].size,
              )
            )
              return;

            this.completed = true;
            this.current.endWire(
              hit,
              connector.name!,
              pos,
              connector.direction!,
            );
            this.current.forceLayoutUpdate();
            this.current = undefined;
            this.context.tools.restore();
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
        this.context.tools.restore();
      }
    }
  }

  onMove(e: EngineMouseEvent): void {
    if (this.current) {
      this.current.moveLastPoint(new Vector(e.wX, e.wY));
    }
  }
}
