import React, { useState, useEffect } from "react";

export default function ConcurrencySlider() {
  const [value, setValue] = useState(4);

  useEffect(() => {
    window.api.getConcurrency().then((v) => {
      if (v) setValue(v);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setValue(v);
    window.api.setConcurrency(v);
  };

  return (
    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Parallel Downloads Limit
        </label>
        <span className="px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-100/50 dark:border-blue-900/30 rounded-full">
          {value} concurrent
        </span>
      </div>

      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={handleChange}
        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />

      <div className="flex justify-between text-[10px] text-slate-400">
        <span>1 (Single)</span>
        <span>4 (Recommended)</span>
        <span>10 (Max Limit)</span>
      </div>
    </div>
  );
}
