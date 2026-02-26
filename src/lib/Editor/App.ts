import { Engine, Log, MouseButton, MouseEventType } from "./core";
import { Grid } from "./entities/Grid";
import { NodeEntity } from "./entities/NodeEntity";

export class App extends Engine {
  grid: Grid = new Grid();

  override onInit(): void {
    this.grid.init(this.context);
    this.grid.sprite.zIndex = -1;
    this.root.addChild(this.grid.getSprite());
    this.world.addChild(new NodeEntity());
    Log("APP", "initialize app");
    this.setPos(250, 300);
  }

  private setDrag(dx: number, dy: number) {
    this.grid.sprite.tilePosition.x += dx;
    this.grid.sprite.tilePosition.y += dy;
    this.world.position.x += dx;
    this.world.position.y += dy;
  }

  private setPos(x: number, y: number) {
    this.grid.sprite.tilePosition.x = x;
    this.grid.sprite.tilePosition.y = y;
    this.world.position.x = x;
    this.world.position.y = y;
  }

  private setSacale(sx: number, sy: number) {}

  protected onInitEvents(): void {
    this.mouse.on(MouseEventType.DOWN_ONCE, () => {
      console.log("on click");
    });
    this.mouse.on(MouseEventType.DRAG, (e) => {
      if (e.button !== MouseButton.MIDDLE) return;
      this.setDrag(e.dx, e.dy);
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
    this.assets.createTexture(NodeEntity.NAME, (g) =>
      NodeEntity.createTexture(g)
    );
    Log("APP", "loading textures");
  }

  protected onResize(width: number, height: number): void {
    //throw new Error("Method not implemented.");
  }
  protected onUpdate(delta: number): void {
    //throw new Error("Method not implemented.");
  }
}
