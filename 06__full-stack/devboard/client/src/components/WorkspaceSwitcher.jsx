import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useWorkspaceStore from "../store/workspace.store";
import { ChevronDown, Plus, LayoutGrid, Check } from "lucide-react";

export default function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (workspace) => {
    setCurrentWorkspace(workspace);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    navigate("/create-workspace");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium text-sm transition shadow-sm border border-slate-200/50 dark:border-slate-700/50 cursor-pointer"
        type="button"
      >
        <LayoutGrid className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <span className="max-w-[140px] truncate">
          {currentWorkspace?.name || "Select Workspace"}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Workspaces
          </div>

          <div className="max-h-60 overflow-y-auto px-1.5 py-1 space-y-0.5">
            {workspaces.length === 0 ? (
              <div className="px-3.5 py-2.5 text-sm text-slate-500 dark:text-slate-400 italic">
                No workspaces found
              </div>
            ) : (
              workspaces.map((workspace) => {
                const isSelected = workspace._id === currentWorkspace?._id;
                return (
                  <button
                    key={workspace._id}
                    onClick={() => handleSelect(workspace)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm font-medium transition cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    type="button"
                  >
                    <span className="truncate">{workspace.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-650 dark:text-indigo-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

          <div className="px-1.5 pb-0.5">
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition cursor-pointer"
              type="button"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Create Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
