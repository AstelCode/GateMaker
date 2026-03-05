/* eslint-disable no-debugger */
import type { Vector } from "./core";
import type { Wire } from "./entities/Wire";
import { Grid } from "./Grid";
import { BinaryHeap, hashPos } from "./utils";

type Node = {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  dx: number;
  dy: number;
  parent?: Node;
};

export class WireRouter {
  // Factor 1.001 para romper empates y preferir caminos rectos
  private static heuristic(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    return (Math.abs(x1 - x2) + Math.abs(y1 - y2)) * 1.001;
  }

  private static readonly DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  static route(
    grid: Grid,
    a: Vector,
    b: Vector,
    startDir?: Vector,
    currentWire?: Wire,
  ): Vector[] {
    const start = Grid.worldToGrid(a);
    const end = Grid.worldToGrid(b);

    if (start.x === end.x && start.y === end.y) {
      return [Grid.gridToWorld(start.x, start.y)];
    }

    const open = new BinaryHeap<Node>((a, b) => a.f - b.f);
    const gScore = new Map<number, number>();

    const startKey = hashPos(start.x, start.y);
    const startH = this.heuristic(start.x, start.y, end.x, end.y);
    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: startH,
      f: startH,
      dx: startDir?.x || 0,
      dy: startDir?.y || 0,
    };
    open.push(startNode);
    gScore.set(startKey, 0);

    const MAX_ITER = 6000;
    let iter = 0;
    const TURN_PENALTY = 20;

    while (!open.isEmpty()) {
      if (++iter > MAX_ITER) return [];

      const cur = open.pop()!;
      const curKey = hashPos(cur.x, cur.y);

      // Si llegamos al destino, reconstruimos el camino
      if (cur.x === end.x && cur.y === end.y) {
        const path: Vector[] = [];
        let node: Node | undefined = cur;
        while (node) {
          path.unshift(Grid.gridToWorld(node.x, node.y));
          node = node.parent;
        }
        return path;
      }

      // Explorar vecinos
      for (const [dx, dy] of WireRouter.DIRS) {
        // No retroceder
        if (cur.dx === -dx && cur.dy === -dy) continue;

        const nx = cur.x + dx;
        const ny = cur.y + dy;
        const nKey = hashPos(nx, ny);

        const cellCost = grid.getCellCost(nx, ny, currentWire);
        if (cellCost === Infinity) continue;

        // Penalización por giro
        let moveCost = cellCost;
        if (cur.dx !== 0 || cur.dy !== 0) {
          if (cur.dx !== dx || cur.dy !== dy) {
            moveCost += TURN_PENALTY;
          }
        }

        const tentativeG = cur.g + moveCost;
        const oldG = gScore.get(nKey);

        // Si ya tenemos un camino mejor, ignoramos
        if (oldG !== undefined && tentativeG >= oldG) continue;

        gScore.set(nKey, tentativeG);
        const h = this.heuristic(nx, ny, end.x, end.y);
        const f = tentativeG + h;

        open.push({
          x: nx,
          y: ny,
          g: tentativeG,
          h,
          f,
          dx,
          dy,
          parent: cur,
        });
      }
    }
    return [];
  }

  static simplifyPath(points: Vector[], interations = 2): Vector[] {
    if (points.length <= 2) return points;
    let l: Vector[] = points,
      out: Vector[] = [];
    for (let j = 0; j < interations; j++) {
      out = [l[0]];
      for (let i = 1; i < l.length - 1; i++) {
        const a = l[i - 1];
        const b = l[i];
        const c = l[i + 1];
        if (a.x === b.x && a.y === b.y) continue;
        if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) {
          continue;
        }
        out.push(b);
      }
      const last = l[l.length - 1];
      const prev = out[out.length - 1];
      if (last.x !== prev.x || last.y !== prev.y) {
        out.push(last);
      }
      l = out;
    }
    return l;
  }
}
