import type { AppEntity } from "../../App";
import type { Memory } from "../../simlulator/Memory";
import { Simulator } from "../../simlulator/Simulator";
import { InputNode, OutputNode, NodeRegister } from "../index";
import {
  ConnectorDirection,
  ConnectorType,
  createNodeTexture,
  NodeEntity,
  NodeType,
  type Connector,
  type NodeConfig,
} from "../NodeEntity";

export interface InternalGates {
  memSize: number;
  externalInputs: number[];
  externalOutputs: number[];
  internalGates: {
    type: string;
    inputs: number[];
    outputs: number[];
  }[];
}

export interface Operation {
  type: string;
  inputs: number[];
  outputs: number[];
}

export interface GateConfig extends NodeConfig {
  internalGates?: InternalGates;
  design?: Record<string, any>;
  custom?: boolean;
}

export class Gate extends NodeEntity {
  static createTexture(config: NodeConfig) {
    return createNodeTexture(config.nodeName, config, this.design);
  }

  inputsMap: string[];
  outputsMap: string[];
  config: GateConfig;
  info: { operations: Operation[]; internalInputs: number[] };

  constructor(config: GateConfig) {
    super();
    this.info = { operations: [], internalInputs: [] };
    this.config = config;
    this.name = config.nodeName;

    this.inputsMap = Object.entries(config.connectors)
      .filter((item) => item[1].type == ConnectorType.INPUT)
      .sort((a, b) => a[1].address - b[1].address)
      .map((item) => item[0]);

    this.outputsMap = Object.entries(config.connectors)
      .filter((item) => item[1].type == ConnectorType.OUTPUT)
      .sort((a, b) => a[1].address - b[1].address)
      .map((item) => item[0]);
  }

  protected createOutputsId(): void {
    if (this.config.internalGates) {
      const { operations, inputs, outputs } = Gate.registerGetGates(
        this.config.internalGates,
        this.context.simulator.memory,
      );
      this.info = { operations, internalInputs: inputs };
      for (const name in this.config.connectors) {
        const connector = this.config.connectors[name];
        if (connector.type == ConnectorType.OUTPUT) {
          this.outputsAddress[name] = outputs[connector.address];
        }
      }
    } else {
      super.createOutputsId();
    }
  }

  private static traveler(
    gate: InternalGates,
    externalInputs: number[] = [],
    externalOutputs: number[] = [],
    context: { usedMemory: Set<number>; maxAddress: number; idx: number },
  ) {
    const operations: Operation[] = [];
    const startIdx = context.idx;
    context.idx += gate.memSize;
    for (let i = 0; i < gate.internalGates.length; i++) {
      // eslint-disable-next-line prefer-const
      let { type, inputs, outputs } = gate.internalGates[i];
      const config = NodeRegister.getConfig(type);
      if (!config) throw new Error("Gate don't exits");
      inputs = inputs.map((i) => {
        const extInpIdx = gate.externalInputs.indexOf(i);
        const extOutIdx = gate.externalOutputs.indexOf(i);
        const id =
          externalInputs[extInpIdx] ??
          externalOutputs[extOutIdx] ??
          i + startIdx;
        if (context.maxAddress < id) context.maxAddress = id;
        context.usedMemory.add(id);
        return id;
      });
      outputs = outputs.map((i) => {
        const extInpIdx = gate.externalInputs.indexOf(i);
        const extOutIdx = gate.externalOutputs.indexOf(i);
        const address =
          externalInputs[extInpIdx] ??
          externalOutputs[extOutIdx] ??
          i + startIdx;
        if (context.maxAddress < address) context.maxAddress = address;
        context.usedMemory.add(address);
        return address;
      });
      if (config.internalGates) {
        operations.push(
          ...this.traveler(config.internalGates, inputs, outputs, context),
        );
      } else {
        operations.push({ type, inputs, outputs });
      }
    }
    return operations;
  }

  private static registerGetGates(gateInfo: InternalGates, memory: Memory) {
    const info = {
      usedMemory: new Set<number>(),
      maxAddress: -Infinity,
      idx: 0,
    };
    const operations = this.traveler(gateInfo, [], [], info);

    let diff = 0;
    const memId = new Map<number, number>();
    for (let i = 0; i <= info.maxAddress; i++) {
      if (!info.usedMemory.has(i)) {
        diff++;
      }
      memId.set(i, i - diff);
    }
    const size = info.usedMemory.size;
    const adress = memory.register(size);

    for (let i = 0; i < operations.length; i++) {
      operations[i].inputs = operations[i].inputs.map(
        (item) => memId.get(item)! + adress,
      );
      operations[i].outputs = operations[i].outputs.map(
        (item) => memId.get(item)! + adress,
      );
    }

    return {
      operations,
      outputs: gateInfo.externalOutputs.map((item) => item + adress),
      inputs: gateInfo.externalInputs.map((item) => item + adress),
    };
  }

  getOperations(): Operation[] {
    if (this.info.operations.length > 0) {
      return [
        {
          type: "SET",
          inputs: this.inputsMap.map((item) => this.inputsAddress[item] ?? -1),
          outputs: this.info.internalInputs,
        },
        ...this.info.operations,
      ];
    }
    return [
      {
        type: this.name,
        outputs: this.outputsMap.map((item) => this.outputsAddress[item] ?? -1),
        inputs: this.inputsMap.map((item) => this.inputsAddress[item] ?? -1),
      },
    ];
  }

  public getGateInfo() {
    return [
      {
        type: this.name,
        outputs: this.outputsMap.map((item) => this.outputsAddress[item] ?? -1),
        inputs: this.inputsMap.map((item) => this.inputsAddress[item] ?? -1),
      },
    ];
  }

  static combineGates(nodes: AppEntity[], name: string) {
    const operations: Operation[] = [];
    const design: Record<string, any>[] = [];
    let inputs: (Connector & { name: string })[] = [];
    let outputs: (Connector & { name: string })[] = [];

    for (const node of nodes) {
      design.push(node.toJson());
    }

    const grapth = Simulator.createGrapth(nodes);

    for (const { node } of grapth) {
      if (node instanceof InputNode) {
        inputs.push({
          name: node.getText(),
          direction: ConnectorDirection.LEFT,
          type: ConnectorType.INPUT,
          size: node.getConnectorSize(),
          idx: node.position.y,
          address: node.outputsAddress["A"],
        });
        continue;
      }
      if (node instanceof OutputNode) {
        outputs.push({
          name: node.getText(),
          direction: ConnectorDirection.RIGHT,
          type: ConnectorType.OUTPUT,
          size: node.getConnectorSize(),
          idx: node.position.y,
          address: node.inputsAddress["A"],
        });
        continue;
      }
      if (node instanceof Gate) {
        operations.push(...node.getGateInfo());
      }
    }

    inputs = inputs
      .sort((a, b) => a.idx - b.idx)
      .map((item, i) => ({ ...item, idx: i }));

    outputs = outputs
      .sort((a, b) => a.idx - b.idx)
      .map((item, i) => ({ ...item, idx: i }));

    const map = new Map<number, number>();
    let count = 0;
    for (let i = 0; i < operations.length; i++) {
      operations[i].inputs = operations[i].inputs.map((item) => {
        if (!map.has(item)) {
          map.set(item, count);
          return count++;
        } else {
          return map.get(item)!;
        }
      });
      operations[i].outputs = operations[i].outputs.map((item) => {
        if (!map.has(item)) {
          map.set(item, count);
          return count++;
        } else {
          return map.get(item)!;
        }
      });
    }

    const externalInputs = inputs.map((item) => map.get(item.address)!);
    const externalOutputs = outputs.map((item) => map.get(item.address)!);
    const connectors: Record<string, Connector> = {};
    outputs.forEach((item, i) => {
      if (connectors[item.name] != undefined)
        throw new Error("Exists connectors with the same name");
      connectors[item.name] = { ...item, address: i };
    });
    inputs.forEach((item, i) => {
      if (connectors[item.name] != undefined)
        throw new Error("Exists connectors with the same name");
      connectors[item.name] = { ...item, address: i };
    });

    const config: GateConfig = {
      showConnectorLabel: true,
      showLabel: true,
      type: NodeType.NODE,
      nodeName: name,
      colSpan: 3,
      rowSpan: Math.max(outputs.length, inputs.length),
      connectors,
      custom: true,
      internalGates: {
        memSize: count,
        externalInputs,
        externalOutputs,
        internalGates: operations,
      },
      design,
    };
    return config;
  }
}
