import React, { useState, useEffect } from "react";

export default function SettingsPage() {
  const [concurrency, setConcurrency] = useState(4);
  const [downloadDir, setDownloadDir] = useState("downloads/");
  const [theme, setTheme] = useState("dark");
  const [autoResume, setAutoResume] = useState(true);
  const [maxGraphSamples, setMaxGraphSamples] = useState(100);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  // Load preferences from SQLite on mount
  useEffect(() => {
    window.api.getConcurrency().then((c) => {
      if (c) setConcurrency(c);
    });

    window.api.getSetting("downloadDir").then((dir) => {
      if (dir) setDownloadDir(dir);
    });

    window.api.getSetting("theme").then((t) => {
      if (t) setTheme(t);
    });

    window.api.getSetting("autoResume").then((ar) => {
      if (ar !== undefined) setAutoResume(ar === "true");
    });

    window.api.getSetting("maxGraphSamples").then((mgs) => {
      if (mgs) setMaxGraphSamples(parseInt(mgs, 10));
    });
  }, []);

  const handleBrowse = async () => {
    const dir = await window.api.selectDirectory();
    if (dir) {
      setDownloadDir(dir);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSave = async () => {
    try {
      await window.api.setConcurrency(concurrency);
      await window.api.setSetting("downloadDir", downloadDir);
      await window.api.setSetting("theme", theme);
      await window.api.setSetting("autoResume", autoResume ? "true" : "false");
      await window.api.setSetting("maxGraphSamples", maxGraphSamples.toString());

      // Ensure theme is applied
      handleThemeChange(theme);

      setSavedStatus("Preferences saved successfully!");
      setTimeout(() => setSavedStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSavedStatus("Failed to save preferences.");
    }
  };

  const handleResetDefaults = () => {
    setConcurrency(4);
    setDownloadDir("downloads/");
    handleThemeChange("dark");
    setAutoResume(true);
    setMaxGraphSamples(100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">
          Settings
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Configure parallel downloads limits, themes, and workspace storage directories.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-8 shadow-sm max-w-2xl space-y-6 transition-colors">
        {/* Parallel downloads concurrency */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Parallel Downloads
            </label>
            <span className="px-2 py-0.5 text-xs font-bold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40 rounded-full border border-blue-100/50 dark:border-blue-900/30">
              {concurrency} downloads
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>1 (Sequential)</span>
            <span>4 (Standard)</span>
            <span>10 (Max Limits)</span>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800/80" />

        {/* Download Folder Picker */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Download Folder
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={downloadDir}
              onChange={(e) => setDownloadDir(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition"
            />
            <button
              onClick={handleBrowse}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer select-none"
            >
              Browse
            </button>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800/80" />

        {/* Theme select radio */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Theme
          </label>
          <div className="flex items-center gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-650 dark:text-slate-400">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === "light"}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-350 focus:ring-blue-500 accent-blue-600"
              />
              <span>Light Theme</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-650 dark:text-slate-400">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === "dark"}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-350 focus:ring-blue-500 accent-blue-600"
              />
              <span>Dark Theme</span>
            </label>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-slate-800/80" />

        {/* Auto resume downloads checkbox */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Auto Resume Downloads
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Automatically resume queued downloads when starting the application.
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoResume}
            onChange={(e) => setAutoResume(e.target.checked)}
            className="w-5 h-5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
          />
        </div>

        <hr className="border-slate-100 dark:border-slate-800/80" />

        {/* Max Graph Samples */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Max Graph Samples
          </label>
          <input
            type="number"
            min={10}
            max={500}
            value={maxGraphSamples}
            onChange={(e) => setMaxGraphSamples(parseInt(e.target.value, 10) || 100)}
            className="w-full max-w-[120px] px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950 transition"
          />
        </div>

        {/* Bottom Save & Actions bar */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/85">
          <div>
            {savedStatus && (
              <span className={`text-xs font-semibold ${savedStatus.includes("successfully") ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                {savedStatus}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 transition cursor-pointer select-none"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition cursor-pointer select-none active:scale-[0.98]"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
