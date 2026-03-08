import { NodeRegister } from "../../NodeRegister";
import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  NodeType,
  type NodeConfig,
} from "../NodeEntity";
import { Nodes } from "./Nodes";
const { LEFT, RIGHT } = ConnectorDirection;
const { INPUT, OUTPUT } = ConnectorType;
export class AndNode extends NodeEntity {
  static name: string = "AND";
  static config: NodeConfig = {
    showConnectorLabel: true,
    showLabel: true,
    nodeName: "AND",
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
    this.name = "AND";
    this.config = AndNode.config;
  }

  public getInfo(): {
    type: number;
    output: number[];
    input: number[];
  } {
    return {
      type: Nodes.AND,
      output: Object.values(this.outputsId),
      input: Object.values(this.inputsId),
    };
  }
}
NodeRegister.registerNode(AndNode);
