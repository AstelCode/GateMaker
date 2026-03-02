/* import { useEffect, useRef } from "react";
import { createApp, destroyApp, type AppInfo } from "../../lib/Editor";
 */
export const Editor = () => {
  //const ref = useRef<HTMLDivElement>(null);
  //const appInfoRef = useRef<AppInfo | null>(null);
  //useEffect(() => {
  //  const container = ref.current;
  //  if (!container) return;
  //
  //  let cancelled = false;
  //
  //  (async () => {
  //    const info = await createApp(container);
  //
  //    if (cancelled) {
  //      destroyApp(info);
  //      return;
  //    }
  //
  //    appInfoRef.current = info;
  //  })();
  //
  //  return () => {
  //    cancelled = true;
  //
  //    if (appInfoRef.current) {
  //      destroyApp(appInfoRef.current);
  //      appInfoRef.current = null;
  //    }
  //  };
  //}, []);
  return <div className="w-screen h-screen" /* ref={ref} */></div>;
};
