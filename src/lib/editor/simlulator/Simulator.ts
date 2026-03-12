import type { Container } from "pixi.js";
import { NodeEntity, NodeType, Gate, type Operation } from "../entities";
import { Memory } from "./Memory";
import type { AppEntity } from "../App";

export class Simulator {
  public memory: Memory;
  public started: boolean;
  private operations: Operation[];
  constructor(private world: Container) {
    this.started = false;
    this.memory = new Memory();
    this.operations = [];
  }

  static createGrapth(entities: AppEntity[]) {
    const nodes = entities.filter(
      (item) =>
        item instanceof NodeEntity && item.config.type == NodeType.INPUT,
    ) as NodeEntity[];

    const memory = new Map<string, { node: NodeEntity; idx: number }>();
    const pathMemory = new Map<string, NodeEntity>();
    const list: NodeEntity[] = [];

    const traveler = (node: NodeEntity) => {
      pathMemory.clear();
      list.length = 0;
      list.push(node);
      let currentIdx = 0;
      while (list.length > 0) {
        const item = list.shift();
        if (!item) continue;
        if (memory.has(item.id)) {
          const idx = memory.get(item.id)?.idx;
          if (idx && currentIdx > idx) {
            memory.set(item.id, { node: item, idx: currentIdx });
          }
        } else {
          if (pathMemory.has(item.id)) continue;
          memory.set(item.id, { node: item, idx: currentIdx });
        }
        if (pathMemory.has(item.id)) continue;
        currentIdx++;
        pathMemory.set(item.id, item);
        item.getNextNodes().forEach((item) => list.push(item));
      }
    };

    nodes.forEach((node) => traveler(node));

    return Array.from(memory.values()).sort((a, b) => a.idx - b.idx);
  }

  static createOperations(nodes: NodeEntity[]) {
    return this.createGrapth(nodes)
      .map((item) => (item.node as Gate).getOperations())
      .flat();
  }

  exectute() {
    // eslint-disable-next-line no-debugger
    debugger;
    for (const operation of this.operations) {
      if (operation.type == "SET") {
        for (let i = 0; i < operation.inputs.length; i++) {
          const a = this.memory.get(operation.inputs[i]);
          this.memory.set(operation.outputs[i], a);
        }
      }
      if (operation.type == "AND") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[1], 0);
        this.memory.setBit(operation.outputs[0], 0, a & b & 1);
      }
      if (operation.type == "NAND") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[1], 0);
        this.memory.setBit(operation.outputs[0], 0, ~(a & b) & 1);
      }
      if (operation.type == "OR") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[1], 0);
        this.memory.setBit(operation.outputs[0], 0, (a | b) & 1);
      }
      if (operation.type == "NOR") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[1], 0);
        this.memory.setBit(operation.outputs[0], 0, ~(a | b) & 1);
      }
      if (operation.type == "XOR") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[1], 0);
        this.memory.setBit(operation.outputs[0], 0, ((~a & b) | (a & ~b)) & 1);
      }
      if (operation.type == "NOT") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        this.memory.setBit(operation.outputs[0], 0, ~a & 1);
      }
      if (operation.type == "Spli2") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[0], 1);
        this.memory.setBit(operation.outputs[0], 0, a & 1);
        this.memory.setBit(operation.outputs[1], 0, b & 1);
      }
      if (operation.type == "Spli4") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[0], 1);
        const c = this.memory.getBit(operation.inputs[0], 2);
        const d = this.memory.getBit(operation.inputs[0], 3);
        this.memory.setBit(operation.outputs[0], 0, a & 1);
        this.memory.setBit(operation.outputs[1], 0, b & 1);
        this.memory.setBit(operation.outputs[2], 0, c & 1);
        this.memory.setBit(operation.outputs[3], 0, d & 1);
      }
      if (operation.type == "Conb2") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[1], 0);
        this.memory.setBit(operation.outputs[0], 0, a & 1);
        this.memory.setBit(operation.outputs[0], 1, b & 1);
      }
      if (operation.type == "Conb4") {
        const a = this.memory.getBit(operation.inputs[0], 0);
        const b = this.memory.getBit(operation.inputs[1], 0);
        const c = this.memory.getBit(operation.inputs[2], 0);
        const d = this.memory.getBit(operation.inputs[3], 0);
        this.memory.setBit(operation.outputs[0], 0, a & 1);
        this.memory.setBit(operation.outputs[0], 1, b & 1);
        this.memory.setBit(operation.outputs[0], 2, c & 1);
        this.memory.setBit(operation.outputs[0], 3, d & 1);
      }
    }
  }

  start() {
    this.started = true;
    const nodes = this.world.children as NodeEntity[];
    this.operations = Simulator.createOperations(nodes);
  }

  loop() {
    if (!this.started) return;
    this.exectute();
  }

  stop() {
    this.started = false;
  }
}
