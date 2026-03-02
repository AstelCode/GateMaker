import { Container, Point, Rectangle } from "pixi.js";

export type EngineMouseEvent = {
  vX: number;
  vY: number;
  wX: number;
  wY: number;
  dx: number;
  dy: number;
  wDx: number;
  wDy: number;
  button: number;
  delta: number;
  target: Container;
};

export enum MouseEventType {
  DOWN,
  MOVE,
  UP,
  DRAG,
  WHEEL,
  OUTSIDE,
}

export type MouseEventFunc = (e: EngineMouseEvent) => void;

type EventsCallbacks = {
  type: MouseEventType;
  func: MouseEventFunc;
}[];

export enum MouseButton {
  LEFT = 1,
  MIDDLE = 4,
  RIGHT = 2,
}

type EventDataProps = {
  global: Point;
  buttons: number;
  target: Container;
};

export class MouseController {
  private callbacks: EventsCallbacks = [];

  private isDragging = false;

  private lastMouse: Point | null = null;
  private lastMouseWorld: Point | null = null;
  private root: Container;
  private world: Container;
  private canvas: HTMLCanvasElement;

  constructor(root: Container, world: Container, canvas: HTMLCanvasElement) {
    this.root = root;
    this.world = world;
    this.root.eventMode = "dynamic";
    this.root.cursor = "default";
    this.root.interactiveChildren = true;
    this.canvas = canvas;
    this.root.hitArea = new Rectangle(0, 0, canvas.width, canvas.height);
  }

  private getEventData(e: EventDataProps, delta: number = 0): EngineMouseEvent {
    const worldPos = this.world.toLocal(e.global);
    return {
      vX: e.global.x,
      vY: e.global.y,
      wX: worldPos.x,
      wY: worldPos.y,
      dx: 0,
      dy: 0,
      wDx: 0,
      wDy: 0,
      button: e.buttons,
      delta,
      target: e.target,
    };
  }

  init() {
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    this.root.on("pointerdown", (_e) => {
      this.isDragging = true;
      const e = this.getEventData(_e);
      this.lastMouse = new Point(e.vX, e.vY);
      this.lastMouseWorld = new Point(e.wX, e.wY);
      this.emit(MouseEventType.DOWN, e);
    });

    this.root.on("pointerup", (_e) => {
      const e = this.getEventData(_e);
      this.isDragging = false;
      this.lastMouse = null;
      this.lastMouseWorld = null;
      this.emit(MouseEventType.UP, e);
    });

    this.root.on("pointermove", (_e) => {
      const e = this.getEventData(_e);
      if (this.isDragging && this.lastMouse && this.lastMouseWorld) {
        const dx = e.vX - this.lastMouse.x;
        const dy = e.vY - this.lastMouse.y;
        const wDx = e.wX - this.lastMouseWorld.x;
        const wDy = e.wY - this.lastMouseWorld.y;
        this.emit(MouseEventType.DRAG, { ...e, dx, dy, wDx, wDy });
        this.lastMouse.set(e.vX, e.vY);
        this.lastMouseWorld.set(e.wX, e.wY);
      }

      this.emit(MouseEventType.MOVE, e);
    });

    this.root.on("pointerupoutside", (_e) => {
      this.isDragging = false;
      const e = this.getEventData(_e);
      this.emit(MouseEventType.OUTSIDE, e);
    });

    this.root.on("wheel", (_e) => {
      const e = this.getEventData(_e, _e.deltaY);
      this.emit(MouseEventType.WHEEL, e);
    });
  }

  private emit(type: MouseEventType, pos: EngineMouseEvent) {
    this.callbacks.filter((c) => c.type === type).forEach((c) => c.func(pos));
  }

  on(type: MouseEventType, func: MouseEventFunc) {
    this.callbacks.push({ type, func });
  }
}
