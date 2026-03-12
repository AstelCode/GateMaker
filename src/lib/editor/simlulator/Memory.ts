export class Memory {
  private memory: Uint16Array;
  private freeMemory: number[];
  private currentId: number;

  constructor(size = 1024) {
    this.memory = new Uint16Array(size);
    this.freeMemory = [];
    this.currentId = 0;
  }

  get buffer() {
    return this.memory;
  }

  register(size: number = 1) {
    if (size > 1) {
      if (size + this.currentId > this.memory.length) {
        throw new Error("Memory overflow");
      }
      const id = this.currentId;
      this.currentId += size + 1;
      return id;
    }
    const id = this.freeMemory.pop() ?? this.currentId++;
    if (id >= this.memory.length) {
      throw new Error("Memory overflow");
    }
    return id;
  }

  delete(id: number, size: number = 1) {
    for (let i = id; i < id + size; i++) {
      this.freeMemory.push(i);
      this.memory[i] = 0;
    }
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
    if (id == -1) return 0;
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
