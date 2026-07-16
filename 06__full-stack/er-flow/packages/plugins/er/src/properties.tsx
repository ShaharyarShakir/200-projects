import React from "react";
import { PropertyEditorProps } from "@eraser/diagram-engine";

export const ErEntityPropertyEditor: React.FC<PropertyEditorProps> = ({
  element,
  updateElement,
}) => {
  const attributes = element.attributes || [];

  const updateAttr = (idx: number, fields: any) => {
    const nextAttrs = [...attributes];
    nextAttrs[idx] = { ...nextAttrs[idx], ...fields };
    updateElement({ attributes: nextAttrs });
  };

  const removeAttr = (id: string) => {
    const nextAttrs = attributes.filter((a: any) => a.id !== id);
    updateElement({ attributes: nextAttrs });
  };

  const addAttr = () => {
    const newAttr = {
      id: crypto.randomUUID(),
      name: "new_column",
      type: "String",
      isPk: false,
      isFk: false,
      isNullable: true,
      isUnique: false,
    };
    updateElement({ attributes: [...attributes, newAttr] });
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs text-slate-300">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Entity Properties</span>
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 font-semibold block">Table Name</label>
        <input
          type="text"
          value={element.text || ""}
          onChange={(e) => updateElement({ text: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs font-semibold text-slate-200"
        />
      </div>

      <hr className="border-slate-800" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Columns / Fields</span>
          <button
            type="button"
            onClick={addAttr}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors"
          >
            + Add Column
          </button>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          {attributes.map((attr: any, idx: number) => (
            <div key={attr.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2 relative group/col">
              <div className="flex items-center gap-1.5 justify-between">
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttr(idx, { name: e.target.value })}
                  placeholder="column_name"
                  className="bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-xs font-bold text-slate-100 w-28 py-0.5"
                />
                
                <button
                  type="button"
                  onClick={() => removeAttr(attr.id)}
                  title="Remove Column"
                  className="text-slate-600 hover:text-rose-450 hover:bg-rose-500/10 p-1 rounded transition-all cursor-pointer opacity-0 group-hover/col:opacity-100"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-650 font-bold block mb-0.5">Type</label>
                  <select
                    value={attr.type}
                    onChange={(e) => updateAttr(idx, { type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-1 py-0.5 outline-none focus:border-indigo-500 text-[10px] text-slate-300 font-mono"
                  >
                    {["String", "Integer", "Boolean", "Float", "Decimal", "Date", "Timestamp", "UUID", "JSON"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-1 pb-0.5">
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-slate-400">
                    <input
                      type="checkbox"
                      checked={attr.isPk}
                      onChange={(e) => updateAttr(idx, { isPk: e.target.checked })}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>PK</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer text-[10px] font-semibold text-slate-400">
                    <input
                      type="checkbox"
                      checked={attr.isFk}
                      onChange={(e) => updateAttr(idx, { isFk: e.target.checked })}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>FK</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1 border-t border-slate-900/50">
                <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  <input
                    type="checkbox"
                    checked={attr.isNullable}
                    onChange={(e) => updateAttr(idx, { isNullable: e.target.checked })}
                    className="rounded border-slate-800 text-indigo-600"
                  />
                  <span>Nullable</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  <input
                    type="checkbox"
                    checked={attr.isUnique}
                    onChange={(e) => updateAttr(idx, { isUnique: e.target.checked })}
                    className="rounded border-slate-800 text-indigo-600"
                  />
                  <span>Unique</span>
                </label>
              </div>
            </div>
          ))}
          {attributes.length === 0 && (
            <p className="text-center text-slate-600 italic py-2 text-[10px]">No columns defined. Click Add.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const ErRelationshipPropertyEditor: React.FC<PropertyEditorProps> = ({
  element,
  updateElement,
  allShapes,
}) => {
  const entities = allShapes.filter((s) => s.type === "er-entity");

  return (
    <div className="space-y-4 animate-fade-in text-xs text-slate-300">
      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Relationship Properties</span>

      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 font-semibold block">Label</label>
        <input
          type="text"
          value={element.label || ""}
          onChange={(e) => updateElement({ label: e.target.value })}
          placeholder="e.g. places, owns, contains"
          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs font-semibold text-slate-200"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Source Entity</label>
          <select
            value={element.sourceEntityId || ""}
            onChange={(e) => updateElement({ sourceEntityId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 outline-none text-xs font-semibold text-slate-200"
          >
            <option value="">(Select)</option>
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>{ent.text || "Untitled"}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Target Entity</label>
          <select
            value={element.targetEntityId || ""}
            onChange={(e) => updateElement({ targetEntityId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 outline-none text-xs font-semibold text-slate-200"
          >
            <option value="">(Select)</option>
            {entities.map((ent) => (
              <option key={ent.id} value={ent.id}>{ent.text || "Untitled"}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Source Card.</label>
          <select
            value={element.sourceCardinality || "1"}
            onChange={(e) => updateElement({ sourceCardinality: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 outline-none text-xs font-semibold text-slate-250 font-mono"
          >
            {["1", "0..1", "*", "1..*", "0..*"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Target Card.</label>
          <select
            value={element.targetCardinality || "*"}
            onChange={(e) => updateElement({ targetCardinality: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 outline-none text-xs font-semibold text-slate-250 font-mono"
          >
            {["1", "0..1", "*", "1..*", "0..*"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 py-1">
        <input
          type="checkbox"
          id="identifying"
          checked={element.identifying ?? true}
          onChange={(e) => updateElement({ identifying: e.target.checked })}
          className="rounded border-slate-800 text-indigo-600"
        />
        <label htmlFor="identifying" className="cursor-pointer text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          Identifying Relationship
        </label>
      </div>
    </div>
  );
};
