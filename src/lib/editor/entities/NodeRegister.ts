import type { AssetManager } from "../core";
import { Gate, type GateConfig, type InternalGates } from "./gates/Gate";
import type { NodeConfig, NodeEntity } from "./NodeEntity";

export class NodeRegister {
  private constructor() {}
  static nodesRecord: Map<string, typeof NodeEntity> = new Map();
  static nodes: (typeof NodeEntity)[] = [];
  static gates: GateConfig[] = [];
  static gatesRecord: Map<
    string,
    NodeConfig & { internalGates?: InternalGates }
  > = new Map();

  static registerNode(node: typeof NodeEntity) {
    this.nodesRecord.set(node.name, node);
    this.nodes.push(node);
  }

  static registerGate(config: GateConfig) {
    this.gatesRecord.set(config.nodeName, config);
    this.gates.push(config);
  }

  static async registerCustomGate(assets: AssetManager, config: GateConfig) {
    this.gatesRecord.set(config.nodeName, config);
    this.gates.push(config);
    await assets.createTexture(Gate.createTexture(config));
  }

  static getConfig(name: string) {
    return this.gatesRecord.get(name);
  }

  static getTextures() {
    const texturesData = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const textureData = this.nodes[i].loadTextures();
      texturesData.push(...textureData);
    }
    for (let i = 0; i < this.gates.length; i++) {
      texturesData.push(...Gate.createTexture(this.gates[i]));
    }
    return texturesData;
  }

  static get(name: string) {
    const config = this.gatesRecord.get(name);
    if (config) {
      return new Gate(config);
    }
    const node = this.nodesRecord.get(name);
    if (node) {
      return new node();
    }
    return undefined;
  }

  static getNames() {
    return [
      ...this.nodes.map((item) => item.name),
      ...this.gates.map((item) => item.nodeName),
    ];
  }
}
