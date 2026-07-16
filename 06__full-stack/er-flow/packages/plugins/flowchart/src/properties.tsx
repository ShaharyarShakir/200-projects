import React from "react";
import { PropertyEditorProps } from "@eraser/diagram-engine";

export const FlowchartNodePropertyEditor: React.FC<PropertyEditorProps> = ({
  element,
  updateElement,
}) => {
  return (
    <div className="space-y-4 animate-fade-in text-xs text-slate-300">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
        Flowchart Node Properties
      </span>
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 font-semibold block">Label / Text</label>
        <input
          type="text"
          value={element.text || ""}
          onChange={(e) => updateElement({ text: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs font-semibold text-slate-200"
        />
      </div>
    </div>
  );
};
