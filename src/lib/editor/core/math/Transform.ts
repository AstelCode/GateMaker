import { Vector } from "./Vector";

export class Transform {
  position = new Vector();
  scale = new Vector(1, 1);
  rotation = 0;
}
