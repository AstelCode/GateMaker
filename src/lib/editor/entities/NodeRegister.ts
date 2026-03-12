import type { AssetManager } from "../core";
import { Gate, type GateConfig } from "./gates/Gate";
import type { NodeEntity } from "./NodeEntity";

type NodeRegisterJson = Record<string, any>;
export class NodeRegister {
  private constructor() {}
  static nodesRecord: Map<string, typeof NodeEntity> = new Map();
  static nodes: (typeof NodeEntity)[] = [];

  static gates: GateConfig[] = [];
  static gatesRecord: Map<string, GateConfig> = new Map();

  static customGates: GateConfig[] = [];
  static customGatesRecord: Map<string, GateConfig> = new Map();

  static registerNode(node: typeof NodeEntity) {
    this.nodesRecord.set(node.name, node);
    this.nodes.push(node);
  }

  static registerGate(config: GateConfig) {
    if (config.custom) {
      this.customGatesRecord.set(config.nodeName, config);
      this.customGates.push(config);
    } else {
      this.gatesRecord.set(config.nodeName, config);
      this.gates.push(config);
    }
  }

  static async registerCustomGate(assets: AssetManager, config: GateConfig) {
    this.customGatesRecord.set(config.nodeName, config);
    this.customGates.push(config);
    await assets.createTexture(Gate.createTexture(config));
  }

  static getConfig(name: string) {
    let data = this.gatesRecord.get(name);
    if (data) return data;
    data = this.customGatesRecord.get(name);
    if (data) return data;
    return undefined;
  }

  static getTextures() {
    const texturesData = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const textureData = this.nodes[i].loadTextures();
      texturesData.push(...textureData);
    }
    for (let i = 0; i < this.customGates.length; i++) {
      texturesData.push(...Gate.createTexture(this.customGates[i]));
    }
    for (let i = 0; i < this.gates.length; i++) {
      texturesData.push(...Gate.createTexture(this.gates[i]));
    }
    return texturesData;
  }

  static getCustomGatesTexture() {
    const texturesData = [];

    for (let i = 0; i < this.customGates.length; i++) {
      texturesData.push(...Gate.createTexture(this.customGates[i]));
    }
    return texturesData;
  }

  static get(name: string) {
    let config = this.gatesRecord.get(name);
    config ??= this.customGatesRecord.get(name);
    if (config) return new Gate(config);
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
      ...this.customGates.map((item) => item.nodeName),
    ];
  }

  static getCatalog(assets: AssetManager) {
    return this.getNames().map((name) => ({
      name,
      src: assets.get(name).src,
    }));
  }

  static load(data: NodeRegisterJson) {
    this.customGatesRecord.clear();
    this.customGates.length = 0;
    for (const key in data) {
      const config = data[key];
      this.customGatesRecord.set(key, config);
      this.customGates.push(config);
    }
  }

  static toJson(): NodeRegisterJson {
    const data: Record<string, any> = {};
    this.customGatesRecord.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }
}
