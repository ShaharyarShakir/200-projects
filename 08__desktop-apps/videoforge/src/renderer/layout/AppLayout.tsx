import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

import DownloadsPage from "../pages/DownloadsPage";
import ActivePage from "../pages/ActivePage";
import CompletedPage from "../pages/CompletePage";
import SettingsPage from "../pages/SettingsPage";
import LibraryPage from "../pages/LibraryPage";
import ConverterPage from "../pages/ConverterPage";


export default function AppLayout() {
    const [page, setPage] = useState("downloads");

    useEffect(() => {
        window.api.getSetting("theme").then((t) => {
            const activeTheme = t || "dark";
            if (activeTheme === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        });
    }, []);

    const renderPage = () => {
        switch (page) {
            case "active":
                return <ActivePage />;
            case "queued":
                return <DownloadsPage />;
            case "completed":
                return <CompletedPage />;
            case "library":
                return <LibraryPage />;
            case "converter":
                return <ConverterPage />;
            case "settings":
                return <SettingsPage />;
            default:
                return <DownloadsPage />;
        }
    };

    const getPageTitle = () => {
        switch (page) {
            case "active":
                return "Active Downloads";
            case "queued":
                return "Downloader Queue";
            case "completed":
                return "Completed Downloads";
            case "library":
                return "Media Library";
            case "converter":
                return "Video & Audio Converter";
            case "settings":
                return "Preferences";
            default:
                return "All Downloads";
        }
    };

    const getPageDescription = () => {
        switch (page) {
            case "active":
                return "Monitor speed and progress of current active streams.";
            case "queued":
                return "Add new download targets and manage the execution queue.";
            case "completed":
                return "Browse successfully saved and downloaded files.";
            case "library":
                return "Manage, search, sort, and preview your media files.";
            case "converter":
                return "Transcode local video and audio files into MP3, MP4, HLS, MKV, and WebM.";
            case "settings":
                return "Configure network limits, file formats, and engines.";
            default:
                return "Manage and monitor your downloads.";
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Sidebar onChange={setPage} active={page} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Modern Header Bar */}
                <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 px-8 flex items-center justify-between shadow-sm transition-colors duration-300">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">
                            {getPageTitle()}
                        </h1>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {getPageDescription()}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 rounded-full border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Engine Connected
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        {renderPage()}
                    </div>
                </main>
            </div>
        </div>
    );
}