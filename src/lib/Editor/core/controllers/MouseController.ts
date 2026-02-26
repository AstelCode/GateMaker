import { Container, Point, Rectangle } from "pixi.js";
import { Log } from "../Log";

export type EngineMouseEvent = {
  x: number;
  y: number;
  vX: number;
  vY: number;
  dx: number;
  dy: number;
  button: number;
  delta: number;
};

export enum MouseEventType {
  DOWN,
  MOVE,
  UP,
  DRAG,
  WHEEL,
  DOWN_ONCE,
  UP_ONCE,
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

  private buttons = 0;
  private container: Container;
  private canvas: HTMLCanvasElement;

  constructor(container: Container, canvas: HTMLCanvasElement) {
    this.container = container;
    this.container.eventMode = "dynamic";
    this.container.cursor = "default";
    this.container.interactiveChildren = true;
    this.canvas = canvas;
    this.container.hitArea = new Rectangle(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  private getEventData(
    e: { global: Point; buttons: number },
    delta: number = 0
  ): EngineMouseEvent {
    const worldPos = this.container.toLocal(e.global);
    return {
      x: worldPos.x,
      y: worldPos.y,
      vX: e.global.x,
      vY: e.global.y,
      dx: 0,
      dy: 0,
      button: e.buttons,
      delta,
    };
  }

  initEvents() {
    Log("MouseController", "init events");
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this.container.on("pointerdown", (_e) => {
      this.isDragging = true;
      const e = this.getEventData(_e);
      if ((this.buttons & _e.buttons) === 0) {
        this.emit(MouseEventType.DOWN_ONCE, e);
      }
      this.buttons = _e.buttons;
      this.lastMouse = new Point(e.x, e.y);
      this.dragStart = new Point(e.x, e.y);
      this.emit(MouseEventType.DOWN, e);
    });
    this.container.on("pointerup", (_e) => {
      const e = this.getEventData(_e);
      if (this.buttons !== 0 && _e.buttons === 0) {
        this.emit(MouseEventType.UP_ONCE, e);
      }
      this.buttons = _e.buttons;
      this.isDragging = false;
      this.lastMouse = null;
      this.dragStart = null;
      this.emit(MouseEventType.UP, e);
    });

    this.container.on("pointermove", (_e) => {
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

    this.container.on("pointerupoutside", () => {
      this.isDragging = false;
      this.buttons = 0;
    });

    this.container.on("wheel", (_e) => {
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
