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
  nodeName: "FLIP_FLOP_D",
  type: NodeType.NODE,
  colSpan: 3,
  rowSpan: 4,
  connectors: {
    A: { direction: LEFT, idx: 0, type: INPUT, size: 1, address: 0 },
    Clock: { direction: LEFT, idx: 3, type: INPUT, size: 1, address: 1 },
    C: { direction: RIGHT, idx: 1, type: OUTPUT, size: 1, address: 0 },
  },
  internalGates: {
    memSize: 7,
    externalInputs: [0, 2],
    externalOutputs: [5],
    internalGates: [
      { type: "NOT", inputs: [0], outputs: [1] },
      { type: "NAND", inputs: [0, 2], outputs: [3] },
      { type: "NAND", inputs: [1, 2], outputs: [4] },
      { type: "NAND", inputs: [3, 6], outputs: [5] },
      { type: "NAND", inputs: [4, 5], outputs: [6] },
    ],
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

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  type: 2,
  colSpan: 3,
  rowSpan: 1,
  nodeName: "aux",
  connectors: {
    A: { direction: 2, type: 1, size: 1, idx: 0, address: 0 },
    Input: {
      direction: 1,
      type: 0,
      size: 4,
      idx: 0,
      address: 0,
    },
  },
  internalGates: {
    memSize: 8,
    externalInputs: [7],
    externalOutputs: [2],
    internalGates: [
      { type: "Spli4", outputs: [5, 6, 3, 4], inputs: [7] },
      { type: "OR", outputs: [2], inputs: [0, 1] },
      { type: "AND", outputs: [1], inputs: [3, 4] },
      { type: "AND", outputs: [0], inputs: [5, 6] },
    ],
  },
});

NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  type: 2,
  colSpan: 4,
  rowSpan: 4,
  nodeName: "Memory",
  connectors: {
    Q4: { direction: 2, type: 1, size: 4, idx: 0, address: 0 },
    D4: { direction: 1, type: 0, size: 4, idx: 0, address: 0 },
    Clock: {
      direction: 1,
      type: 0,
      size: 1,
      idx: 1,
      address: 1,
    },
  },
  internalGates: {
    memSize: 11,
    externalInputs: [0, 10],
    externalOutputs: [9],
    internalGates: [
      { type: "Spli4", outputs: [1, 2, 3, 4], inputs: [0] },
      { type: "FLIP_FLOP_D", outputs: [8], inputs: [4, 10] },
      { type: "FLIP_FLOP_D", outputs: [7], inputs: [3, 10] },
      { type: "FLIP_FLOP_D", outputs: [6], inputs: [2, 10] },
      { type: "FLIP_FLOP_D", outputs: [5], inputs: [1, 10] },
      { type: "Conb4", outputs: [9], inputs: [5, 6, 7, 8] },
    ],
  },
});
NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  type: 2,
  colSpan: 3,
  rowSpan: 5,
  nodeName: "aux2",
  connectors: {
    OUT: { direction: 2, type: 1, size: 1, idx: 0, address: 0 },
    A: { direction: 1, type: 0, size: 1, idx: 0, address: 0 },
    B: { direction: 1, type: 0, size: 1, idx: 1, address: 1 },
    C: { direction: 1, type: 0, size: 1, idx: 2, address: 2 },
    D: { direction: 1, type: 0, size: 1, idx: 3, address: 3 },
    Clock: {
      direction: 1,
      type: 0,
      size: 1,
      idx: 4,
      address: 4,
    },
  },
  internalGates: {
    memSize: 8,
    externalInputs: [0, 1, 2, 3, 5],
    externalOutputs: [7],
    internalGates: [
      { type: "Conb4", outputs: [4], inputs: [0, 1, 2, 3] },
      { type: "Memory", outputs: [6], inputs: [4, 5] },
      { type: "aux", outputs: [7], inputs: [6] },
    ],
  },
});
NodeRegister.registerGate({
  showConnectorLabel: true,
  showLabel: true,
  type: 2,
  nodeName: "new",
  colSpan: 3,
  rowSpan: 1,
  connectors: {
    B: { direction: 2, type: 1, size: 2, idx: 0, address: 0 },
    A: { direction: 1, type: 0, size: 2, idx: 0, address: 0 },
  },
  internalGates: {
    memSize: 6,
    externalInputs: [0],
    externalOutputs: [5],
    internalGates: [
      { type: "Spli2", outputs: [1, 2], inputs: [0] },
      { type: "OR", outputs: [3], inputs: [1, 2] },
      { type: "NOT", outputs: [4], inputs: [3] },
      { type: "Conb2", outputs: [5], inputs: [3, 4] },
    ],
  },
});
