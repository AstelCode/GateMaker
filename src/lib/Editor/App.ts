import { Engine, Log, MouseButton, MouseEventType } from "./core";
import { Grid } from "./Grid";

export class App extends Engine {
  grid: Grid = new Grid(50);

  override onInit(): void {
    this.grid.init(this.context);
    this.root.addChild(this.grid.getSprite());
    this.mouse.on(MouseEventType.DOWN_ONCE, () => {
      console.log("on click");
    });
    Log("APP", "initialize app");
  }

  protected onInitEvents(): void {
    this.mouse.on(MouseEventType.DRAG, (e) => {
      if (e.button !== MouseButton.MIDDLE) return;
      this.grid.sprite.tilePosition.x += e.dx;
      this.grid.sprite.tilePosition.y += e.dy;
      this.world.position.x += e.dx;
      this.world.position.y += e.dy;
    });

    this.mouse.on(MouseEventType.WHEEL, (e) => {
      const scaleFactor = e.delta > 0 ? 0.9 : 1.1;

      // Usamos las coordenadas globales de la pantalla del ratón
      const mouseX = e.vX;
      const mouseY = e.vY;

      // 1. Aplicamos la fórmula al Mundo Físico
      this.world.position.x =
        mouseX - (mouseX - this.world.position.x) * scaleFactor;
      this.world.position.y =
        mouseY - (mouseY - this.world.position.y) * scaleFactor;

      this.world.scale.x *= scaleFactor;
      this.world.scale.y *= scaleFactor;

      if (this.grid.sprite) {
        this.grid.sprite.tilePosition.x =
          mouseX - (mouseX - this.grid.sprite.tilePosition.x) * scaleFactor;
        this.grid.sprite.tilePosition.y =
          mouseY - (mouseY - this.grid.sprite.tilePosition.y) * scaleFactor;

        // IMPORTANTE: Escalamos tileScale, NO el sprite
        this.grid.sprite.tileScale.x *= scaleFactor;
        this.grid.sprite.tileScale.y *= scaleFactor;
      }
    });
  }

  protected async onInitTextures() {
    this.grid.createTexture(this.context);
    Log("APP", "loading textures");
  }
}
