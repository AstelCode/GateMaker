import { NodeRegister } from "../NodeRegister";
import { ConnectorDirection, ConnectorType, NodeType } from "../NodeEntity";
const { LEFT, RIGHT, TOP, BOTTOM } = ConnectorDirection;
const { INPUT, OUTPUT } = ConnectorType;

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "NAND",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 3,
  connectors: {
    A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    B: { direction: LEFT, idx: 2, type: INPUT, size: 1, address: 1 },
    C: { direction: RIGHT, idx: 1, type: OUTPUT, size: 1, address: 0 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "OR",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 3,
  connectors: {
    A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    B: { direction: LEFT, idx: 2, type: INPUT, size: 1, address: 1 },
    C: { direction: RIGHT, idx: 1, type: OUTPUT, size: 1, address: 0 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "NOR",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 3,
  connectors: {
    A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    B: { direction: LEFT, idx: 2, type: INPUT, size: 1, address: 1 },
    C: { direction: RIGHT, idx: 1, type: OUTPUT, size: 1, address: 0 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "XOR",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 3,
  connectors: {
    A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    B: { direction: LEFT, idx: 2, type: INPUT, size: 1, address: 1 },
    C: { direction: RIGHT, idx: 1, type: OUTPUT, size: 1, address: 0 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "AND",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 3,
  connectors: {
    A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    B: { direction: LEFT, idx: 2, type: INPUT, size: 1, address: 1 },
    C: { direction: RIGHT, idx: 1, type: OUTPUT, size: 1, address: 0 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "NOT",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 1,
  connectors: {
    A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    C: { direction: RIGHT, idx: 0, type: OUTPUT, size: 1, address: 0 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "Spli2",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 3,
  connectors: {
    In: { direction: LEFT, idx: 1, type: INPUT, size: 2, address: 0 },
    "0": { direction: RIGHT, idx: 0, type: OUTPUT, size: 1, address: 0 },
    "1": { direction: RIGHT, idx: 2, type: OUTPUT, size: 1, address: 1 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "Spli4",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 4,
  connectors: {
    In: { direction: LEFT, idx: 0, type: INPUT, size: 4, address: 0 },
    "0": { direction: RIGHT, idx: 0, type: OUTPUT, size: 1, address: 0 },
    "1": { direction: RIGHT, idx: 1, type: OUTPUT, size: 1, address: 1 },
    "2": { direction: RIGHT, idx: 2, type: OUTPUT, size: 1, address: 2 },
    "3": { direction: RIGHT, idx: 3, type: OUTPUT, size: 1, address: 3 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "Conb2",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 3,
  connectors: {
    Out: { direction: RIGHT, idx: 1, type: OUTPUT, size: 2, address: 0 },
    "0": { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    "1": { direction: LEFT, idx: 2, type: INPUT, size: 1, address: 1 },
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  nodeName: "Conb4",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 4,
  connectors: {
    In: { direction: RIGHT, idx: 0, type: OUTPUT, size: 4, address: 0 },
    "0": { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    "1": { direction: LEFT, idx: 1, type: INPUT, size: 1, address: 1 },
    "2": { direction: LEFT, idx: 2, type: INPUT, size: 1, address: 2 },
    "3": { direction: LEFT, idx: 3, type: INPUT, size: 1, address: 3 },
  },
});
