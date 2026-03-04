export const fastFloor = (x: number) => (x >= 0 ? x | 0 : Math.floor(x));
export const hashPos = (x: number, y: number) =>
  ((x & 0xffff) << 16) | (y & 0xffff);

export class BinaryHeap<T> {
  private heap: T[] = [];

  constructor(private compare: (a: T, b: T) => number) {}

  push(item: T) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number) {
    const element = this.heap[index];
    while (index > 0) {
      const parentIdx = (index - 1) >> 1;
      const parent = this.heap[parentIdx];
      if (this.compare(element, parent) >= 0) break;
      this.heap[parentIdx] = element;
      this.heap[index] = parent;
      index = parentIdx;
    }
  }

  private sinkDown(index: number) {
    const length = this.heap.length;
    const element = this.heap[index];
    while (true) {
      const leftChildIdx = (index << 1) + 1;
      const rightChildIdx = leftChildIdx + 1;
      let swap: number | null = null;
      let leftChild, rightChild;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (this.compare(leftChild, element) < 0) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          this.compare(rightChild, swap === null ? element : leftChild!) < 0
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      this.heap[swap] = element;
      index = swap;
    }
  }
}
