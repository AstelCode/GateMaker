import type { Container } from "pixi.js";
import { NodeEntity, Nodes, NodeType } from "../entities";
import { Memory } from "./Memory";

export class Simulator {
  public memory: Memory;
  public started: boolean;
  private grapth: {
    type: number;
    output: number[];
    input: number[];
  }[];
  constructor(private world: Container) {
    this.started = false;
    this.memory = new Memory();
    this.grapth = [];
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

    this.grapth = Array.from(memory.values())
      .filter(
        (item) =>
          item.node.config.type != NodeType.INPUT &&
          item.node.config.type != NodeType.OUTPUT,
      )
      .sort((a, b) => a.idx - b.idx)
      .map((item) => item.node.getInfo());
  }

  exectute() {
    for (const item of this.grapth) {
      if (item.type == Nodes.AND) {
        if (item.input.length == 2) {
          const a = this.memory.getBit(item.input[0], 0);
          const b = this.memory.getBit(item.input[1], 0);
          this.memory.setBit(item.output[0], 0, a & b & 1);
        }
      }
      if (item.type == Nodes.NAND) {
        if (item.input.length == 2) {
          const a = this.memory.getBit(item.input[0], 0);
          const b = this.memory.getBit(item.input[1], 0);
          this.memory.setBit(item.output[0], 0, ~(a & b) & 1);
        }
      }
      if (item.type == Nodes.OR) {
        if (item.input.length == 2) {
          const a = this.memory.getBit(item.input[0], 0);
          const b = this.memory.getBit(item.input[1], 0);
          this.memory.setBit(item.output[0], 0, (a | b) & 1);
        }
      }
      if (item.type == Nodes.NOT) {
        if (item.input.length == 1) {
          const a = this.memory.getBit(item.input[0], 0);
          this.memory.setBit(item.output[0], 0, ~a & 1);
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
