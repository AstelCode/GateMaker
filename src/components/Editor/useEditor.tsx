import { createContext, useContext } from "react";
import type { AppInfo } from "../../lib/editor";

export const EditorContext = createContext<AppInfo | null>(null);

export const useEditor = () => {
  return useContext(EditorContext);
};
