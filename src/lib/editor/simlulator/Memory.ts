export class Memory {
  private memory: Uint32Array;
  private freeMemory: number[];
  private currentId: number;

  constructor() {
    this.memory = new Uint32Array(1024);
    this.freeMemory = [];
    this.currentId = 0;
  }

  get buffer() {
    return this.memory;
  }

  register() {
    const id = this.freeMemory.pop() ?? this.currentId++;
    if (id >= this.memory.length) {
      throw new Error("Memory overflow");
    }
    return id;
  }

  delete(id: number) {
    this.freeMemory.push(id);
    this.memory[id] = 0;
  }

  set(id: number, value: number) {
    if (id >= this.memory.length) {
      throw new Error("Memory overflow");
    }
    this.memory[id] = value;
  }

  get(id: number) {
    if (id >= this.memory.length) {
      throw new Error("Memory overflow");
    }
    return this.memory[id];
  }

  getBit(id: number, bit: number) {
    return (this.memory[id] >> bit) & 1;
  }

  setBit(id: number, bit: number, value: number) {
    if (value) {
      this.memory[id] |= 1 << bit;
    } else {
      this.memory[id] &= ~(1 << bit);
    }
  }

  getBits(id: number, offset: number, size: number) {
    const mask = (1 << size) - 1;
    return (this.memory[id] >> offset) & mask;
  }

  clear() {
    this.currentId = 0;
    this.freeMemory.length = 0;
    this.memory.fill(0);
  }
}
