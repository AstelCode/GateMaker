import { Text } from "pixi.js";
export const createText = (
  text: string,
  fontSize: number,
  color: number,
  bold: boolean = true,
) => {
  const label = new Text({
    text: text,
    resolution: 3,
    style: {
      fontFamily: "CascadiaMono",
      fontSize: fontSize,
      fill: color,
      fontWeight: bold ? "bold" : "normal",
    },
  });
  label.anchor.set(0.5);
  return label;
};
export const fastFloor = (x: number) => (x >= 0 ? x | 0 : Math.floor(x));
export const hashPos = (x: number, y: number) => `${x}:${y}`;
