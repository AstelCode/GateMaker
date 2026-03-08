import { NodeRegister } from "../../NodeRegister";
import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
} from "../NodeEntity";
const { LEFT, RIGHT, TOP } = ConnectorDirection;
const { INPUT, OUTPUT } = ConnectorType;
export class Mux4Node extends NodeEntity {
  static name: string = "MUX4";
  static config: NodeConfig = {
    showConnectorLabel: true,
    showLabel: true,
    nodeName: "MUX4",
    type: NodeType.NODE,
    colSpan: 4,
    rowSpan: 4,
    connectors: {
      A: { direction: LEFT, idx: 0, type: INPUT },
      B: { direction: LEFT, idx: 1, type: INPUT },
      C: { direction: LEFT, idx: 2, type: INPUT },
      D: { direction: LEFT, idx: 3, type: INPUT },
      S1: { direction: TOP, idx: 1, type: INPUT },
      S2: { direction: TOP, idx: 2, type: INPUT },
      E: { direction: RIGHT, idx: 0, type: OUTPUT },
    },
  };
  constructor() {
    super();
    this.name = "MUX4";
    this.config = Mux4Node.config;
  }
}
NodeRegister.registerNode(Mux4Node);
