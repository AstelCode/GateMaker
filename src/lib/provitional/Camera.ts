import type { Container } from "pixi.js";
import type { Grid } from "../entities/Grid";
import { MouseButton, type EngineMouseEvent } from "../../core";

export class Camera {
  constructor(
    private grid: Grid,
    private world: Container,
  ) {}

  move(x: number, y: number) {
    this.grid.sprite.tilePosition.x = x;
    this.grid.sprite.tilePosition.y = y;
    this.world.position.x = x;
    this.world.position.y = y;
  }

  scale(sx: number, sy: number) {
    this.world.scale.x *= sx;
    this.world.scale.y *= sy;
    this.grid.sprite.tileScale.x *= sx;
    this.grid.sprite.tileScale.y *= sy;
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
    const x = e.x;
    const y = e.y;
    const scaleFactor = e.delta > 0 ? 0.9 : 1.1;

    this.world.position.x = x - (x - this.world.position.x) * scaleFactor;
    this.world.position.y = y - (y - this.world.position.y) * scaleFactor;
    this.grid.sprite.tilePosition.x =
      x - (x - this.grid.sprite.tilePosition.x) * scaleFactor;
    this.grid.sprite.tilePosition.y =
      y - (y - this.grid.sprite.tilePosition.y) * scaleFactor;

    this.scale(scaleFactor, scaleFactor);
  }
}
