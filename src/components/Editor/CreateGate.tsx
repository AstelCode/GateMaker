import { useEffect, useState } from "react";
import { useEditor } from "./useEditor";
import {
  ConnectorDirection,
  ConnectorType,
  NodeEntity,
  type Connector,
  type GateConfig,
} from "../../lib/editor/entities";

type Direction = "top" | "bottom" | "left" | "right";

interface GatePin {
  name: string;
  direction: Direction;
  idx: number;
  key: string;
  type: "input" | "output";
}

export const CreateGateControl = () => {
  const app = useEditor();

  const [pins, setPins] = useState<GatePin[]>([
    { name: "", direction: "top", idx: 0, key: "", type: "input" },
  ]);

  const [data, setData] = useState<{
    config: GateConfig;
    selection: NodeEntity[];
  } | null>(null);

  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);

  const [isOpen, setIsOpen] = useState(false);

  const [nodeName, setNodeName] = useState("");

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  };

  const getMaxIdx = (direction: Direction) => {
    if (direction === "top" || direction === "bottom") return cols - 1;
    return rows - 1;
  };

  const hasConflict = (pin: GatePin, i: number) => {
    return pins.some(
      (p, j) => j !== i && p.direction === pin.direction && p.idx === pin.idx,
    );
  };

  const onClick = () => {
    setIsOpen(false);
  };

  const updatePin = (i: number, field: keyof GatePin, value: any) => {
    setPins((prev) => {
      const copy = [...prev];

      const updated = { ...copy[i], [field]: value };

      const max = getMaxIdx(updated.direction);

      if (field === "direction") {
        updated.idx = clamp(updated.idx, 0, max);
      }

      /*       if (field === "idx") {
        updated.idx = clamp(value, 0, max);
      }
 */
      /*       const conflict = copy.some(
        (p, j) =>
          j !== i && p.direction === updated.direction && p.idx === updated.idx,
      );

      if (conflict) return prev; */

      copy[i] = updated;

      return copy;
    });
  };

  const toDirectionString = (direction: ConnectorDirection) => {
    if (direction & ConnectorDirection.TOP) return "top";
    if (direction & ConnectorDirection.BOTTOM) return "bottom";
    if (direction & ConnectorDirection.LEFT) return "left";
    return "right";
  };
  const toDirectionNumber = (direciton: Direction) => {
    if (direciton == "top") return ConnectorDirection.TOP;
    if (direciton == "bottom") return ConnectorDirection.BOTTOM;
    if (direciton == "left") return ConnectorDirection.LEFT;
    return ConnectorDirection.RIGHT;
  };

  useEffect(() => {
    if (!app) return;

    app.engine
      .getEvents()
      .on(
        "openCreateGate",
        (data: { config: GateConfig; selection: NodeEntity[] }) => {
          setPins(
            Object.entries(data.config.connectors).map(
              ([key, item]: [string, Connector]) => ({
                key,
                name: key,
                idx: item.idx,
                direction: toDirectionString(item.direction),
                type: item.type == ConnectorType.INPUT ? "input" : "output",
              }),
            ),
          );
          setNodeName(data.config.nodeName);
          setData(data);
          setIsOpen(true);
        },
      );
  }, [app]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPins((prev) =>
      prev.map((pin) => ({
        ...pin,
        idx: clamp(pin.idx, 0, getMaxIdx(pin.direction)),
      })),
    );
  }, [rows, cols]);

  const onCreate = () => {
    if (!data) return;
    const gateInfo = { ...data.config };
    gateInfo.nodeName = nodeName;
    gateInfo.colSpan = cols;
    gateInfo.rowSpan = rows;
    pins.forEach((item) => {
      const connector = gateInfo.connectors[item.key];
      delete gateInfo.connectors[item.key];
      delete (connector as any)[item.name];
      connector.direction = toDirectionNumber(item.direction);
      connector.idx = item.idx;
      gateInfo.connectors[item.name] = connector;
    });
    app?.engine
      .getEvents()
      .emit("onCreateGate", { config: gateInfo, selection: data.selection });

    setIsOpen(false);
  };

  return (
    <div
      className="absolute w-full h-full top-0 left-0 flex"
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div className="w-screen h-screen bg-neutral-800 opacity-35" />

      <div
        className="absolute w-screen h-screen flex items-center justify-center"
        onClick={onClick}
      >
        <div
          className="w-120 h-120 bg-white rounded-xl text-lg flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-4 pt-6 px-6 pb-4">
            <div className="flex gap-4">
              <span>Name</span>
              <input
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                className="outline-none bg-stone-100 border rounded-sm text-center h-7"
              />
            </div>

            <div className="flex gap-4">
              <span className="w-13">Size</span>

              <div className="flex gap-3">
                <span>Cols</span>
                <input
                  type="number"
                  value={cols}
                  min={1}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="outline-none bg-stone-100 border rounded-sm text-center w-12 h-7"
                />

                <span>Rows</span>
                <input
                  type="number"
                  value={rows}
                  min={1}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="outline-none bg-stone-100 border rounded-lg text-center w-12 h-7"
                />
              </div>
            </div>
          </div>

          <div className="bg-neutral-200 w-full h-full p-2 flex flex-col gap-2 overflow-y-auto">
            {pins.map((pin, i) => {
              const conflict = hasConflict(pin, i);

              return (
                <div
                  key={i}
                  className={`relative h-10 rounded-lg flex items-center gap-3 px-3 ${pin.type == "input" ? "bg-blue-300" : "bg-green-300"} ${
                    conflict ? " border border-red-500" : ""
                  }`}
                >
                  <span>Name</span>

                  <input
                    className="border rounded px-1 w-35 bg-white"
                    value={pin.name}
                    onChange={(e) => updatePin(i, "name", e.target.value)}
                  />

                  <span>Dir</span>

                  <select
                    value={pin.direction}
                    onChange={(e) =>
                      updatePin(i, "direction", e.target.value as Direction)
                    }
                    className="border rounded bg-white"
                  >
                    <option value="top">top</option>
                    <option value="bottom">bottom</option>
                    <option value="left">left</option>
                    <option value="right">right</option>
                  </select>

                  <span>Idx</span>

                  <input
                    type="number"
                    className="border rounded w-14 text-center bg-white"
                    min={0}
                    /* max={getMaxIdx(pin.direction)} */
                    value={pin.idx}
                    onChange={(e) =>
                      updatePin(i, "idx", Number(e.target.value))
                    }
                  />
                  <div
                    className={`absolute ${pin.type == "input" ? "-left-2" : "-right-2"} w-3 h-6 rounded-md bg-neutral-800`}
                  ></div>
                </div>
              );
            })}
          </div>

          <div className="w-full p-4">
            <div
              className="w-full flex items-center justify-center cursor-pointer hover:bg-neutral-400 bg-neutral-300 py-3 rounded-lg text-xl"
              onClick={onCreate}
            >
              Create
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
