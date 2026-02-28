import { Container, Point, Rectangle } from "pixi.js";
import { Log } from "../Log";

export type EngineMouseEvent = {
  x: number;
  y: number;
  wX: number;
  wY: number;
  dx: number;
  dy: number;
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

export class MouseController {
  private callbacks: EventsCallbacks = [];

  private isDragging = false;

  private lastMouse: Point | null = null;
  private dragStart: Point | null = null;
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
    this.root.hitArea = new Rectangle(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
  }

  private getEventData(
    e: { global: Point; buttons: number; target: Container },
    delta: number = 0,
  ): EngineMouseEvent {
    const worldPos = this.world.toLocal(e.global);
    return {
      x: e.global.x,
      y: e.global.y,
      wX: worldPos.x,
      wY: worldPos.y,
      dx: 0,
      dy: 0,
      button: e.buttons,
      delta,
      target: e.target,
    };
  }

  initEvents() {
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this.root.on("pointerdown", (_e) => {
      this.isDragging = true;
      const e = this.getEventData(_e);
      this.lastMouse = new Point(e.x, e.y);
      this.dragStart = new Point(e.x, e.y);
      this.emit(MouseEventType.DOWN, e);
    });
    this.root.on("pointerup", (_e) => {
      const e = this.getEventData(_e);
      this.isDragging = false;
      this.lastMouse = null;
      this.dragStart = null;
      this.emit(MouseEventType.UP, e);
    });

    this.root.on("pointermove", (_e) => {
      const e = this.getEventData(_e);
      if (this.isDragging && this.lastMouse && this.dragStart) {
        const dx = e.x - this.lastMouse.x;
        const dy = e.y - this.lastMouse.y;
        this.emit(MouseEventType.DRAG, { ...e, dx, dy });
        this.lastMouse.set(e.x, e.y);
      } else {
        this.emit(MouseEventType.MOVE, e);
      }
    });

    this.root.on("pointerupoutside", () => {
      this.isDragging = false;
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
