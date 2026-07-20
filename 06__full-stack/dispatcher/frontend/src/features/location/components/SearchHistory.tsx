import React from 'react';
import { History, Trash2 } from 'lucide-react';
import type { LocationItem } from '../types/location';


interface SearchHistoryProps {
  history: LocationItem[];
  onSelect: (location: LocationItem) => void;
  onClear: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onClear,
}) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="p-2 border-t border-slate-700/60 bg-slate-900/90">
      <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
        <span className="flex items-center gap-1 font-medium">
          <History className="w-3 h-3 text-slate-400" /> Recent Searches
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-0.5"
        >
          <Trash2 className="w-2.5 h-2.5" /> Clear
        </button>
      </div>
      <div className="flex flex-col gap-0.5 mt-1 max-h-36 overflow-y-auto">
        {history.map((item, idx) => (
          <button
            key={`${item.place_id}-${idx}`}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded transition-colors truncate"
          >
            {item.display_name}
          </button>
        ))}
      </div>
    </div>
  );
};
