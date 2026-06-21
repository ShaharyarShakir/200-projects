import { useState } from "react";

export default function DownloadInput({
  onDownload,
}: {
  onDownload: (url: string, format?: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp4");

  const handleSubmit = () => {
    if (!url.trim()) return;
    onDownload(url.trim(), format);
    setUrl("");
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          className="w-full pl-4 pr-10 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200"
          placeholder="Paste video URL here (e.g. YouTube, Vimeo, Twitter)..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {url && (
          <button
            onClick={() => setUrl("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="appearance-none pl-4 pr-10 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200 cursor-pointer w-full md:w-auto"
        >
          <option value="mp4" className="dark:bg-slate-900 dark:text-slate-250">MP4 Video</option>
          <option value="webm" className="dark:bg-slate-900 dark:text-slate-250">WEBM Video</option>
          <option value="mp3" className="dark:bg-slate-900 dark:text-slate-250">MP3 Audio</option>
          <option value="hls" className="dark:bg-slate-900 dark:text-slate-250">HLS Stream</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <button
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
        onClick={handleSubmit}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Download
      </button>
    </div>
  );
}