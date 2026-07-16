import React from "react";
import { PropertyEditorProps } from "@eraser/diagram-engine";

export const UmlClassPropertyEditor: React.FC<PropertyEditorProps> = ({
  element,
  updateElement,
}) => {
  const fields = element.fields || [];
  const methods = element.methods || [];

  const updateField = (idx: number, val: string) => {
    const next = [...fields];
    next[idx] = val;
    updateElement({ fields: next });
  };

  const addField = () => {
    updateElement({ fields: [...fields, "+ newProperty: String"] });
  };

  const removeField = (idx: number) => {
    updateElement({ fields: fields.filter((_: any, i: number) => i !== idx) });
  };

  const updateMethod = (idx: number, val: string) => {
    const next = [...methods];
    next[idx] = val;
    updateElement({ methods: next });
  };

  const addMethod = () => {
    updateElement({ methods: [...methods, "+ newMethod(): void"] });
  };

  const removeMethod = (idx: number) => {
    updateElement({ methods: methods.filter((_: any, i: number) => i !== idx) });
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs text-slate-300">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
        UML Class Properties
      </span>
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 font-semibold block">Class Name</label>
        <input
          type="text"
          value={element.text || ""}
          onChange={(e) => updateElement({ text: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs font-semibold text-slate-200"
        />
      </div>

      <hr className="border-slate-800" />

      {/* Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Fields / Properties</span>
          <button
            type="button"
            onClick={addField}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
          >
            + Add Field
          </button>
        </div>
        <div className="space-y-1.5">
          {fields.map((f: string, idx: number) => (
            <div key={idx} className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <input
                type="text"
                value={f}
                onChange={(e) => updateField(idx, e.target.value)}
                className="bg-transparent border-none outline-none font-mono text-[10px] text-slate-350 flex-1"
              />
              <button
                type="button"
                onClick={() => removeField(idx)}
                className="text-slate-500 hover:text-rose-400 font-bold px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Methods */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Methods / Operations</span>
          <button
            type="button"
            onClick={addMethod}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
          >
            + Add Method
          </button>
        </div>
        <div className="space-y-1.5">
          {methods.map((m: string, idx: number) => (
            <div key={idx} className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <input
                type="text"
                value={m}
                onChange={(e) => updateMethod(idx, e.target.value)}
                className="bg-transparent border-none outline-none font-mono text-[10px] text-slate-350 flex-1"
              />
              <button
                type="button"
                onClick={() => removeMethod(idx)}
                className="text-slate-500 hover:text-rose-400 font-bold px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
