import { MdOutlineFolderOpen } from "react-icons/md";
import { FiSave } from "react-icons/fi";
import { useEditor } from "./useEditor";

let activeFile: FileSystemFileHandle | null = null;

function supportsFSAPI() {
  return "showOpenFilePicker" in window && "showSaveFilePicker" in window;
}

async function openProject(setData: (data: any) => void) {
  try {
    if (supportsFSAPI()) {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: "JSON Project",
            accept: { "application/json": [".json"] },
          },
        ],
      });

      activeFile = handle;

      const file = await handle.getFile();
      const text = await file.text();
      setData(JSON.parse(text));
    } else {
      // fallback universal
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const text = await file.text();
        setData(JSON.parse(text));
      };

      input.click();
    }
  } catch (e) {
    console.log("Open cancelled", e);
  }
}

async function saveProject(data: any) {
  try {
    if (supportsFSAPI()) {
      if (!activeFile) {
        activeFile = await (window as any).showSaveFilePicker({
          suggestedName: "project.json",
          types: [
            {
              description: "JSON Project",
              accept: { "application/json": [".json"] },
            },
          ],
        });
      }

      const writable = await (activeFile as any).createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } else {
      // fallback universal
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "project.json";
      a.click();

      URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.log("Save cancelled", e);
  }
}

export const FileControl = () => {
  const app = useEditor();

  const handleOpen = async () => {
    await openProject(async (data) => {
      await app?.engine.load(data);
    });
  };

  const handleSave = async () => {
    const data = app?.engine.toJson();
    await saveProject(data);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className="flex items-center justify-center absolute border top-4 left-4 w-13 h-13 rounded-lg bg-white border-[#757575] cursor-pointer"
      >
        <MdOutlineFolderOpen size={30} />
      </div>

      <div
        onClick={handleSave}
        className="flex items-center justify-center absolute border top-4 left-20 w-13 h-13 rounded-lg bg-white border-[#757575] cursor-pointer"
      >
        <FiSave size={30} />
      </div>
    </>
  );
};
