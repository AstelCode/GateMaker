import { Entity } from "../../core";
import type { Memory } from "../../simlulator/Memory";
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
import { Wire } from "../Wire";

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

export class Gate extends NodeEntity {
  static createTexture(config: NodeConfig) {
    return createNodeTexture(config.nodeName, config, this.design);
  }

  inputsMap: string[];
  outputsMap: string[];
  config: NodeConfig & { internalGates?: InternalGates };
  info: { operations: Operation[]; internalInputs: number[] };

  constructor(config: NodeConfig & { internalGates?: InternalGates }) {
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
      console.log(this.config, this.info.operations, this.outputsAddress);
    } else {
      super.createOutputsId();
    }
  }

  private static traveler(
    gate: InternalGates,
    idx: number,
    externalInputs: number[] = [],
    externalOutputs: number[] = [],
    memory: { usedMemory: Set<number>; maxAddress: number },
  ) {
    const operations: Operation[] = [];
    let aux = gate.memSize;
    for (let i = 0; i < gate.internalGates.length; i++) {
      const { type, inputs, outputs } = gate.internalGates[i];
      const config = NodeRegister.getConfig(type);
      if (!config) throw new Error("Gate don't exits");
      if (config.internalGates) {
        operations.push(
          ...this.traveler(
            config.internalGates,
            idx + aux,
            inputs,
            outputs,
            memory,
          ),
        );
        aux += config.internalGates.memSize;
      } else {
        operations.push({
          type,
          inputs: inputs.map((i) => {
            const extInpIdx = gate.externalInputs.indexOf(i);
            const extOutIdx = gate.externalOutputs.indexOf(i);
            const id =
              externalInputs[extInpIdx] ??
              externalOutputs[extOutIdx] ??
              i + idx;
            if (memory.maxAddress < id) memory.maxAddress = id;
            memory.usedMemory.add(id);
            return id;
          }),
          outputs: outputs.map((i) => {
            const extInpIdx = gate.externalInputs.indexOf(i);
            const extOutIdx = gate.externalOutputs.indexOf(i);
            const address =
              externalInputs[extInpIdx] ??
              externalOutputs[extOutIdx] ??
              i + idx;
            if (memory.maxAddress < address) memory.maxAddress = address;
            memory.usedMemory.add(address);
            return address;
          }),
        });
      }
    }
    return operations;
  }

  private static registerGetGates(gateInfo: InternalGates, memory: Memory) {
    const info = { usedMemory: new Set<number>(), maxAddress: -Infinity };
    const operations = this.traveler(gateInfo, 0, [], [], info);

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

  private getGateInfo() {
    return [
      {
        type: this.name,
        outputs: this.outputsMap.map((item) => this.outputsAddress[item] ?? -1),
        inputs: this.inputsMap.map((item) => this.inputsAddress[item] ?? -1),
      },
    ];
  }

  static combineGates(nodes: Entity[], name: string) {
    const operations: Operation[] = [];
    let inputs: (Connector & { name: string })[] = [];
    let outputs: (Connector & { name: string })[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (nodes instanceof Wire) continue;
      if (node instanceof Gate) {
        operations.push(...node.getGateInfo());
      }
      if (node instanceof InputNode) {
        inputs.push({
          name: node.getText(),
          direction: ConnectorDirection.LEFT,
          type: ConnectorType.INPUT,
          size: node.getConnectorSize(),
          idx: node.position.y,
          address: node.outputsAddress["A"],
        });
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
      connectors[item.name] = { ...item, address: i };
    });
    inputs.forEach((item, i) => {
      connectors[item.name] = { ...item, address: i };
    });

    const config: NodeConfig & { internalGates?: InternalGates } = {
      showConnectorLabel: true,
      showLabel: true,
      type: NodeType.NODE,
      nodeName: name,
      colSpan: 3,
      rowSpan: Math.max(outputs.length, inputs.length),
      connectors,
      internalGates: {
        memSize: count,
        externalInputs,
        externalOutputs,
        internalGates: operations,
      },
    };
    console.dir(JSON.stringify(config));
  }
}
