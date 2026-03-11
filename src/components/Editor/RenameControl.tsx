import { useEffect, useState } from "react";
import { useEditor } from "./useEditor";

export const RenameControl = () => {
  const app = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<{ text: string; data: any }>({
    text: "",
    data: null,
  });

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsOpen(false);
    app?.engine.getEvents().emit("getNewName", value);
  };

  const onClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!app) return;
    app.engine.getEvents().on("openRename", (data) => {
      setIsOpen(true);
      setValue(data);
    });
  }, [app]);

  const onChange = (text: string) => {
    setValue({
      ...value,
      text: text,
    });
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
          className="w-80 h-18 bg-white rounded-xl flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={onSubmit}>
            <input
              className="w-75 h-13 rounded-xl border-2 border-neutral-600 text-center text-2xl"
              onChange={(e) => onChange(e.target.value)}
              value={value.text}
            />
          </form>
        </div>
      </div>
    </div>
  );
};
