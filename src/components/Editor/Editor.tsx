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
      onContextMenu={(e) => e.preventDefault()}
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

const ComponentsCatalog = ({
  items = [],
  onClick,
}: {
  items: { src: string; name: string }[];
  onClick: (name: string) => void;
}) => {
  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="absolute right-2.5 top-2.5 border border-gray-700 w-80 h-[calc(100vh-20px)] rounded-[10px] bg-white"
    >
      <div className="w-full grid place-content-center h-20">
        <input
          className="border border-gray-700 rounded-lg w-64 h-10 outline-none px-4 text-center text-lg"
          placeholder="buscar"
        />
      </div>

      <div className="px-5 min-w-80 w-80  grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))]   content-start gap-10 h-[calc(100%-80px)]">
        {items.map((item) => (
          <div
            className="w-30 h-33 rounded-[10px] flex flex-col items-center justify-between hover:bg-stone-100 hover:border duration-75 py-1"
            onClick={() => onClick(item.name)}
            key={item.name}
          >
            <div className="w-20 h-20 grid place-content-center">
              <img src={item.src} width={70} />
            </div>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Editor = () => {
  const ref = useRef<HTMLDivElement>(null);

  const appInfoRef = useRef<AppInfo | null>(null);

  const [uiState, setUiState] = useState<{
    contextMenu: {
      options: { name: string; id: string; data: any; color?: string }[];
      position: { x: number; y: number } | null;
    };
    catalog: {
      items: { name: string; src: string }[];
      isOpen: boolean;
      position: { x: number; y: number } | null;
    };
  }>({
    contextMenu: { options: [], position: null },
    catalog: { items: [], isOpen: false, position: null },
  });

  const onClickContext = (id: string, data: any) => {
    if (!appInfoRef.current) return;
    appInfoRef.current.engine.getEvents().emit(`context_${id}`, data);
    appInfoRef.current.engine.getEvents().emit(`contextOptionSelected`);
    setUiState((prev) => ({
      ...prev,
      contextMenu: { ...prev.contextMenu, position: null },
    }));
  };

  const onClickCatalog = (name: string) => {
    if (!appInfoRef.current) return;
    setUiState((prev) => ({
      ...prev,
      catalog: { ...prev.catalog, isOpen: false },
    }));
    appInfoRef.current.engine
      .getEvents()
      .emit("onComponentSelected", { name, ...uiState.catalog.position! });
  };

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      const info = await createApp(container);

      info.engine.getEvents().on("setContextMenu", (options) => {
        setUiState((prev) => ({
          ...prev,
          contextMenu: { ...prev.contextMenu, options },
        }));
      });

      info.engine.getEvents().on("openContextMenu", (position) => {
        setUiState((prev) => ({
          ...prev,
          contextMenu: { ...prev.contextMenu, position },
        }));
      });

      info.engine.getEvents().on("closeModal", () => {
        setUiState((prev) => ({
          ...prev,
          contextMenu: { ...prev.contextMenu, position: null },
          catalog: { ...prev.catalog, isOpen: false },
        }));
      });

      info.engine.getEvents().on("setComponentCatalog", (items) => {
        setUiState((prev) => ({
          ...prev,
          catalog: { ...prev.catalog, items },
        }));
      });

      info.engine.getEvents().on("openComponentCatalog", (data) => {
        setUiState((prev) => ({
          ...prev,
          catalog: { ...prev.catalog, isOpen: true, position: data },
        }));
      });

      info.engine.getEvents().on("closeComponentCatalog", () => {
        setUiState((prev) => ({
          ...prev,
          catalog: { ...prev.catalog, isOpen: false },
        }));
      });

      info.engine.startUI();

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
      {uiState.contextMenu.position && (
        <ContextMenu
          options={uiState.contextMenu.options}
          onClick={onClickContext}
          x={uiState.contextMenu.position.x}
          y={uiState.contextMenu.position.y}
        />
      )}
      {uiState.catalog.isOpen && (
        <ComponentsCatalog
          items={uiState.catalog.items}
          onClick={onClickCatalog}
        />
      )}
    </div>
  );
};
