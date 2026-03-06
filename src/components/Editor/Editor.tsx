import { useRef, useEffect, useState } from "react";
import { createApp, destroyApp, type AppInfo } from "../../lib/editor";

const ContextMenu = ({
  options,
  onClick,
  x,
  y,
}: {
  options: {
    name: string;
    id: string;
    data: any;
    color?: string;
  }[];
  onClick: (name: string, data: any) => void;
  x: number;
  y: number;
}) => {
  return (
    <div
      style={{ left: x, top: y }}
      className="absolute w-30   top-25 left-25 border border-gray-700 bg-white rounded-sm overflow-hidden"
    >
      {options.map((option) => (
        <div
          className="grid place-content-center h-8 hover:bg-gray-300 cursor-pointer"
          onClick={() => onClick(option.id, option.data)}
          key={option.id}
          style={{ color: option.color }}
        >
          {option.name}
        </div>
      ))}
    </div>
  );
};

export const Editor = () => {
  const ref = useRef<HTMLDivElement>(null);
  const appInfoRef = useRef<AppInfo | null>(null);
  const [options, setOptions] = useState<
    {
      name: string;
      id: string;
      data: any;
      color?: string;
    }[]
  >([]);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  const onClick = (id: string, data: any) => {
    if (!appInfoRef.current) return;
    appInfoRef.current.engine.getEvents().emit(`context_${id}`, data);
    appInfoRef.current.engine.getEvents().emit(`contextOptionSelected`);
    setPosition(null);
  };

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      const info = await createApp(container);

      info.engine.getEvents().on("setContextMenu", (data) => {
        setOptions(data);
      });

      info.engine.getEvents().on("openContextMenu", (data) => {
        setPosition(data);
      });

      info.engine.getEvents().on("closeContextMenu", () => {
        setPosition(null);
      });

      if (cancelled) {
        destroyApp(info);
        return;
      }

      appInfoRef.current = info;
    })();

    return () => {
      cancelled = true;

      if (appInfoRef.current) {
        destroyApp(appInfoRef.current);
        appInfoRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen" ref={ref}>
      {position && (
        <ContextMenu
          options={options}
          onClick={onClick}
          x={position.x}
          y={position.y}
        />
      )}
    </div>
  );
};
