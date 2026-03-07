import type { NodeEntity } from "./entities/NodeEntity";

export class NodeRegister {
  private constructor() {}
  static nodesRecord: Map<string, typeof NodeEntity> = new Map();
  static nodes: (typeof NodeEntity)[] = [];

  static registerNode(node: typeof NodeEntity) {
    this.nodesRecord.set(node.name, node);
    this.nodes.push(node);
  }

  static getTextures() {
    const texturesData = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const textureData = this.nodes[i].loadTextures();
      texturesData.push(...textureData);
    }
    return texturesData;
  }

  static get(name: string) {
    return this.nodesRecord.get(name);
  }

  static getNames() {
    return this.nodes.map((item) => item.name);
  }
}
