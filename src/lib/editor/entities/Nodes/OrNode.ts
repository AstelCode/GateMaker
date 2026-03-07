import { NodeRegister } from "../../NodeRegister";
import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
} from "../NodeEntity";
const { LEFT, RIGHT } = ConnectorDirection;
const { INPUT, OUTPUT } = ConnectorType;
export class OrNode extends NodeEntity {
  static name: string = "OR";
  static config: NodeConfig = {
    showConnectorLabel: true,
    showLabel: true,
    nodeName: "OR",
    type: NodeType.NODE,
    colSpan: 3,
    rowSpan: 3,
    connectors: {
      A: { direction: LEFT, idx: 0, type: INPUT },
      B: { direction: LEFT, idx: 2, type: INPUT },
      C: { direction: RIGHT, idx: 1, type: OUTPUT },
    },
  };
  constructor() {
    super();
    this.name = "OR";
    this.config = OrNode.config;
  }
}

NodeRegister.registerNode(OrNode);
