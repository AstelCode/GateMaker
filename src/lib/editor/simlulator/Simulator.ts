import type { Container } from "pixi.js";
import { NodeEntity, NodeType } from "../entities";
import { Memory } from "./Memory";
import { Gate, type Operation } from "../entities/gates/Gate";

export class Simulator {
  public memory: Memory;
  public started: boolean;
  private operations: Operation[];
  constructor(private world: Container) {
    this.started = false;
    this.memory = new Memory();
    this.operations = [];
  }

  createGrapth() {
    const memory = new Map<string, { node: NodeEntity; idx: number }>();
    const pathMemory = new Map<string, NodeEntity>();
    const list: NodeEntity[] = [];

    const startedNodes = this.world.children.filter(
      (item) =>
        item instanceof NodeEntity && item.config.type == NodeType.INPUT,
    ) as NodeEntity[];

    const traveler = (node: NodeEntity) => {
      pathMemory.clear();
      list.length = 0;
      list.push(node);
      let currentIdx = 0;
      while (list.length > 0) {
        const item = list.pop();
        if (!item) continue;
        if (pathMemory.has(item.id)) continue;
        if (memory.has(item.id)) {
          const idx = memory.get(item.id)?.idx;
          if (idx && currentIdx < idx) {
            memory.set(item.id, { node: item, idx: currentIdx });
          }
        } else {
          memory.set(item.id, { node: item, idx: currentIdx });
        }
        currentIdx++;
        pathMemory.set(item.id, item);
        item.getNextNodes().forEach((item) => list.push(item));
      }
    };

    startedNodes.forEach((node) => traveler(node));

    this.operations = Array.from(memory.values())
      .filter(
        (item) =>
          item.node.config.type != NodeType.INPUT &&
          item.node.config.type != NodeType.OUTPUT &&
          item.node instanceof Gate,
      )
      .sort((a, b) => a.idx - b.idx)
      .map((item) => (item.node as Gate).getOperations())
      .flat();
  }

  exectute() {
    for (const operation of this.operations) {
      if (operation.type == "SET") {
        for (let i = 0; i < operation.inputs.length; i++) {
          const a = this.memory.getBit(operation.inputs[i], 0);
          this.memory.setBit(operation.outputs[i], 0, a & 1);
        }
      }
      if (operation.type == "AND") {
        if (operation.inputs.length == 2) {
          const a = this.memory.getBit(operation.inputs[0], 0);
          const b = this.memory.getBit(operation.inputs[1], 0);
          this.memory.setBit(operation.outputs[0], 0, a & b & 1);
        }
      }
      if (operation.type == "NAND") {
        if (operation.inputs.length == 2) {
          const a = this.memory.getBit(operation.inputs[0], 0);
          const b = this.memory.getBit(operation.inputs[1], 0);
          this.memory.setBit(operation.outputs[0], 0, ~(a & b) & 1);
        }
      }
      if (operation.type == "OR") {
        if (operation.inputs.length == 2) {
          const a = this.memory.getBit(operation.inputs[0], 0);
          const b = this.memory.getBit(operation.inputs[1], 0);
          this.memory.setBit(operation.outputs[0], 0, (a | b) & 1);
        }
      }
      if (operation.type == "NOR") {
        if (operation.inputs.length == 2) {
          const a = this.memory.getBit(operation.inputs[0], 0);
          const b = this.memory.getBit(operation.inputs[1], 0);
          this.memory.setBit(operation.outputs[0], 0, ~(a | b) & 1);
        }
      }
      if (operation.type == "XOR") {
        if (operation.inputs.length == 2) {
          const a = this.memory.getBit(operation.inputs[0], 0);
          const b = this.memory.getBit(operation.inputs[1], 0);
          this.memory.setBit(
            operation.outputs[0],
            0,
            ((~a & b) | (a & ~b)) & 1,
          );
        }
      }
      if (operation.type == "NOT") {
        if (operation.inputs.length == 1) {
          const a = this.memory.getBit(operation.inputs[0], 0);
          this.memory.setBit(operation.outputs[0], 0, ~a & 1);
        }
      }
    }
  }

  start() {
    this.started = true;
    this.createGrapth();
  }
  loop() {
    if (!this.started) return;
    this.exectute();
  }

  stop() {
    this.started = false;
  }
}
