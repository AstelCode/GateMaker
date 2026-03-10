import { Vector } from "../../core";
import { NodeRegister } from "../../NodeRegister";
import type { Memory } from "../../simlulator/Memory";
import {
  ConnectorType,
  createNodeTexture,
  NodeEntity,
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
}
