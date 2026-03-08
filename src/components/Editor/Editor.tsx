import { useRef, useEffect, useState } from "react";
import { createApp, destroyApp, type AppInfo } from "../../lib/editor";
import { ComponentsCatalog } from "./ComponentsCatalog";
import { EditorContext } from "./useEditor";
import { ContextMenu } from "./ContextMenu";
import { SimulationControls } from "./SimulationControls";

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
        <ContextMenu />
        <ComponentsCatalog />
        <SimulationControls />
      </div>
    </EditorContext.Provider>
  );
};
