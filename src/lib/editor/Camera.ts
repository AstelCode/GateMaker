import type { Container } from "pixi.js";
import type { Grid } from "./Grid";
import { MouseButton, type EngineMouseEvent } from "./core";

export class Camera {
  minZoom: number = 0.3;
  maxZoom: number = 1.8;

  constructor(
    private grid: Grid,
    private world: Container,
  ) {}

  move(x: number, y: number) {
    this.grid.setPosition(x, y);
    this.world.position.set(x, y);
  }

  onDrag(e: EngineMouseEvent) {
    if (e.button != MouseButton.MIDDLE) return false;
    const { dx, dy } = e;

    this.grid.sprite.tilePosition.x += dx;
    this.grid.sprite.tilePosition.y += dy;
    this.world.position.x += dx;
    this.world.position.y += dy;

    return true;
  }

  onWheel(e: EngineMouseEvent) {
    const mouseX = e.vX;
    const mouseY = e.vY;

    const zoomIntensity = 0.001;
    const delta = -e.delta!;
    const zoomFactor = Math.exp(delta * zoomIntensity);

    const currentZoom = this.world.scale.x;
    const newZoom = currentZoom * zoomFactor;

    if (newZoom < this.minZoom || newZoom > this.maxZoom) {
      return;
    }

    this.world.position.x =
      mouseX - (mouseX - this.world.position.x) * zoomFactor;
    this.world.position.y =
      mouseY - (mouseY - this.world.position.y) * zoomFactor;

    this.grid.sprite.tilePosition.x =
      mouseX - (mouseX - this.grid.sprite.tilePosition.x) * zoomFactor;
    this.grid.sprite.tilePosition.y =
      mouseY - (mouseY - this.grid.sprite.tilePosition.y) * zoomFactor;

    // 2. Aplicar la nueva escala
    this.world.scale.set(newZoom);
    this.grid.sprite.tileScale.set(newZoom);
  }
}
