import { useState, useMemo, useEffect } from "react";
import { BsGrid1X2Fill } from "react-icons/bs";
import { useEditor } from "./useEditor";

export const ComponentsCatalog = () => {
  const app = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const items = useMemo(() => {
    return app?.engine.getProviders().get("componentCatalog") || [];
  }, [app]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;

    return items.filter((item: any) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [items, searchTerm]);

  const toggle = () => {
    if (isOpen) {
      setSearchTerm("");
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    app?.engine.getEvents().on("closeModal", () => {
      setSearchTerm("");
      setIsOpen(false);
    });
    app?.engine.getEvents().on("openComponentCatalog", () => {
      setIsOpen(true);
    });
  }, [app]);

  const onClick = (name: string) => {
    setIsOpen(false);
    app?.engine.getEvents().emit("onComponentSelected", { name });
  };

  return (
    <>
      <div
        onClick={toggle}
        className="cursor-pointer absolute top-3 right-3 w-13 h-13  border rounded-lg bg-[#f3f3f3] border-[#757575] hover:bg-[#ffffff] shadow-2xl grid place-content-center "
      >
        <BsGrid1X2Fill size={28} fill="#B8B8B8" />
      </div>
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="absolute right-2.5 top-20 border border-gray-700 w-80 h-[calc(100vh-120px)] rounded-[10px] bg-white"
        style={{ display: isOpen ? "block" : "none" }}
      >
        <div className="w-full grid place-content-center h-20">
          <input
            className="border border-gray-700 rounded-lg w-64 h-10 outline-none px-4 text-center text-lg"
            placeholder="buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="px-5 min-w-80 w-80  grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))]   content-start gap-10 h-[calc(100%-80px)]">
          {filteredItems.map((item) => (
            <div
              className="cursor-pointer w-30 h-33 rounded-[10px] flex flex-col items-center justify-between hover:bg-stone-100 hover:border duration-75 py-1"
              onClick={() => onClick?.(item.name)}
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
    </>
  );
};
