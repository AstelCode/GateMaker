import { MdOutlineFolderOpen } from "react-icons/md";
import { FiSave } from "react-icons/fi";
import { useEditor } from "./useEditor";
let activeFile: FileSystemFileHandle | null = null;

async function openProject(setData: (data: any) => void) {
  try {
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

    const data = JSON.parse(text);

    setData(data);
  } catch (e) {
    console.log("Open cancelled", e);
  }
}

async function saveProject(data: any) {
  try {
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
