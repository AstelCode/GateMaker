import { useRef, useEffect, useState } from "react";
import { createApp, destroyApp, type AppInfo } from "../../lib/editor";
import { ComponentsCatalog } from "./ComponentsCatalog";
import { EditorContext } from "./useEditor";
import { ContextMenu } from "./ContextMenu";
import { SimulationControls } from "./SimulationControls";
import { RenameControl } from "./RenameControl";
import toast, { Toaster } from "react-hot-toast";
import { CreateGateControl } from "./CreateGate";

export const Editor = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<AppInfo | null>(null);

  useEffect(() => {
    if (app) return;
    const container = ref.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      const info = await createApp(container);
      if (cancelled) {
        destroyApp(info);
        return;
      }

      info.engine.getEvents().on("errorMessage", (message) => {
        toast.error(message, { duration: 2000 });
      });
      info.engine.getEvents().on("successMessage", (message) => {
        toast.success(message, { duration: 2000 });
      });

      setApp(info);
    })();

    return () => {
      cancelled = true;
      if (app) destroyApp(app);
    };
  }, [app]);

  return (
    <EditorContext.Provider value={app}>
      <div className="w-screen h-screen" ref={ref}>
        <CreateGateControl />
        <Toaster />
        <ContextMenu />
        <ComponentsCatalog />
        <SimulationControls />
        <RenameControl />
      </div>
    </EditorContext.Provider>
  );
};
