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
export class NotNode extends NodeEntity {
  static name: string = "NOT";
  static config: NodeConfig = {
    showConnectorLabel: true,
    showLabel: true,
    nodeName: "NOT",
    type: NodeType.NODE,
    colSpan: 3,
    rowSpan: 1,
    connectors: {
      A: { direction: LEFT, idx: 0, type: INPUT },
      C: { direction: RIGHT, idx: 0, type: OUTPUT },
    },
  };
  constructor() {
    super();
    this.name = "NOT";
    this.config = NotNode.config;
  }
}
NodeRegister.registerNode(NotNode);
