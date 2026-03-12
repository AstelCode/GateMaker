import { useState, useEffect } from "react";
import { useEditor } from "./useEditor";

export const ContextMenu = () => {
  const app = useEditor();

  const [contextMenu, setContextMenu] = useState<{
    options: { name: string; id: string; data: any; color?: string }[];
    position: { x: number; y: number };
    isOpen: boolean;
  }>({ options: [], position: { x: 0, y: 0 }, isOpen: false });

  useEffect(() => {
    if (!app) return;
    app.engine
      .getEvents()
      .on(
        "setContextMenu",
        (
          options: { name: string; id: string; data: any; color?: string }[],
        ) => {
          setContextMenu((prev) => ({
            ...prev,
            options,
          }));
        },
      );

    app.engine
      .getEvents()
      .on("openContextMenu", (position: { x: number; y: number }) => {
        setContextMenu((prev) => ({
          ...prev,
          position,
          isOpen: true,
        }));
      });

    app.engine.getEvents().on("closeModal", () => {
      setContextMenu((prev) => ({
        ...prev,
        isOpen: false,
      }));
    });
  }, [app]);

  const onClick = (id: string, data: any) => {
    if (!app) return;
    app.engine.getEvents().emit(`context_${id}`, data);
    app.engine.getEvents().emit(`contextOptionSelected`, id);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div
      style={{
        left: contextMenu.position!.x,
        top: contextMenu.position!.y,
        display: contextMenu.isOpen ? "block" : "none",
      }}
      className="absolute w-20   top-25 left-25 border border-gray-700 bg-white rounded-sm overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {contextMenu.options.map((option) => (
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
