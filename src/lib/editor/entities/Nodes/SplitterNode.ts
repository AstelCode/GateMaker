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
export class Splitter4Node extends NodeEntity {
  static name: string = "SPL4";
  static config: NodeConfig = {
    showConnectorLabel: false,
    showLabel: true,
    nodeName: "SPL4",
    type: NodeType.NODE,
    colSpan: 3,
    rowSpan: 4,
    connectors: {
      A: { direction: RIGHT, idx: 0, type: OUTPUT },
      B: { direction: RIGHT, idx: 1, type: OUTPUT },
      C: { direction: RIGHT, idx: 2, type: OUTPUT },
      D: { direction: RIGHT, idx: 3, type: OUTPUT },
      E: { direction: LEFT, idx: 0, type: INPUT },
    },
  };
  constructor() {
    super();
    this.name = "SPL4";
    this.config = Splitter4Node.config;
  }
}
NodeRegister.registerNode(Splitter4Node);
