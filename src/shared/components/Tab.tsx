import { FileJson, SearchIcon, Upload } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface TabProps {
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
}
const Tab: React.FC<TabProps> = ({ activeIndex, setActiveIndex }) => {
  return (
    <div className="flex border-b border-slate-200">
      <button
        type="button"
        onClick={() => setActiveIndex(0)}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative cursor-pointer ${
          activeIndex === 0
            ? "text-indigo-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Upload size={18} />
        Upload
        {activeIndex === 0 && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
        )}
      </button>
      <button
        type="button"
        onClick={() => setActiveIndex(1)}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative cursor-pointer ${
          activeIndex === 1
            ? "text-indigo-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <SearchIcon size={18} />
        Search
        {activeIndex === 1 && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
        )}
      </button>
      <button
        type="button"
        onClick={() => setActiveIndex(2)}
        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative cursor-pointer ${
          activeIndex === 2
            ? "text-indigo-600"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <FileJson size={18} />
        Swagger
        {activeIndex === 2 && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
        )}
      </button>
    </div>
  );
};

export default Tab;
