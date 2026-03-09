import { FaPlay } from "react-icons/fa6";

import { FaStop } from "react-icons/fa";
import { useEditor } from "./useEditor";
import { useState } from "react";
export const SimulationControls = () => {
  const app = useEditor();
  const [active, setActive] = useState(false);
  const onStart = () => {
    app?.engine.getEvents().emit("startSimulation");
    setActive(true);
  };
  const onStop = () => {
    app?.engine.getEvents().emit("stopSimulation");
    setActive(false);
  };
  return (
    <div className="flex justify-around items-center   absolute border bottom-5 left-[50%] -translate-x-[50%] w-20 h-15 rounded-lg bg-white border-[#757575]">
      {active ? (
        <div
          onClick={onStop}
          className="p-2 hover:bg-[#ebebeb] rounded-xl cursor-pointer select-none"
        >
          <FaStop size={30} fill="#EC5353" />
        </div>
      ) : (
        <div
          onClick={onStart}
          className="p-2 hover:bg-[#ebebeb] rounded-xl cursor-pointer select-none"
        >
          <FaPlay size={30} fill="#53EC53" />
        </div>
      )}
    </div>
  );
};
