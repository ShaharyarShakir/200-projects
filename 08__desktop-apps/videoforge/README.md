# VideoForge

VideoForge is a premium, state-of-the-art desktop application built using Electron, React, TypeScript, and Tailwind CSS. It serves as an advanced media tool allowing users to queue and download high-quality videos/audio using `yt-dlp`, transcode local files into multiple formats via FFmpeg, and organize their content in an offline-first Media Library with metadata extraction and local video playback.

---

## Key Features

*   📥 **Advanced Downloader**:
    *   Powered by `yt-dlp` for downloading streams from YouTube and other video platforms.
    *   Flexible quality selection (1080p, 720p, etc.) and format target configurations.
    *   Concurrency control (queue system) allowing you to limit simultaneous downloads.
    *   Ability to pause, resume, cancel, and re-order queued items.
    *   Real-time speed and progress monitoring with graphical network charts.
*   🔄 **FFmpeg Transcoding Engine**:
    *   Powered by `fluent-ffmpeg` and bundled static binaries (`ffmpeg-static` and `ffprobe-static`).
    *   Convert video or audio to multiple formats including **MP3** (with custom bitrates), **MP4**, **WebM**, **MKV**, and **HLS** (HTTP Live Streaming segments).
    *   Automatic conversion pipeline that triggers automatically for downloaded files targeting secondary formats (e.g., MP3 audio conversion).
*   📂 **Offline Media Library**:
    *   Local catalog powered by SQLite (`better-sqlite3`) stored locally in the application's user data directory.
    *   SHA-256 duplicate checking using hash streams to avoid importing identical files.
    *   Automated metadata extraction (resolutions, file sizes, formats, and durations) via `ffprobe`.
    *   Automatic video thumbnail generation at 10% of the video duration.
    *   Safe local playback via a custom protocol (`media://`) registered securely to bypass Electron's Content Security Policies.
*   🌗 **Preferences & Personalization**:
    *   Configurable target download folders.
    *   Adjustable download concurrency limits.
    *   Dark and light theme support.

---

## Architecture Stack

*   **Host Environment**: Electron (Dual-process model: Main process in Node.js, Renderer process in Chromium)
*   **Module Bundler**: Vite (integrated via Electron Forge Vite plugin)
*   **Language**: TypeScript
*   **UI Library**: React (19+)
*   **Styling**: Tailwind CSS
*   **State Management**: Zustand
*   **Database**: SQLite (`better-sqlite3`) configured in WAL mode

---

## Getting Started

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed (v18+ recommended).
2.  **yt-dlp**: VideoForge relies on `yt-dlp` to download media streams. Ensure it is installed on your system and available in your environment path:
    *   **Linux (Ubuntu/Debian)**: `sudo apt install yt-dlp` or install via python pip: `pip install yt-dlp`
    *   **macOS**: `brew install yt-dlp`
    *   **Windows**: Download the binary from the [yt-dlp release page](https://github.com/yt-dlp/yt-dlp) and add it to your System PATH variables.

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/ShaharyarShakir/200-projects.git
cd 200-projects/08__desktop-apps/videoforge
npm install
```

### Running Locally (Development Mode)

To start the application in development mode with hot-reloading and Chrome DevTools opened automatically:

```bash
npm run start
```

### Packaging & Distribution

To package the application for your local operating system:

```bash
npm run package
```

To build distributable installers (e.g., `.deb`, `.rpm`, `.exe`, `.dmg` or `.zip` depending on the platform settings in `forge.config.ts`):

```bash
npm run make
```

---

## File Structure

```
├── forge.config.ts          # Electron Forge build & maker configuration
├── index.html               # Main entry HTML file for renderer process
├── package.json             # Scripts, dependencies, and configuration
├── src/
│   ├── electron/            # Main process code (Node.js/Electron API)
│   │   ├── main.ts          # Electron main entry, protocol registry, and lifecycle
│   │   ├── preload.ts       # Secure context bridge API mapping
│   │   ├── core/            # Event bus and IPC registration
│   │   ├── db/              # SQLite database index, schema, and repository layers
│   │   └── services/        # Downloader (yt-dlp), converter (ffmpeg), & library services
│   ├── renderer/            # Renderer process code (React UI layer)
│   │   ├── App.tsx          # Renderer main React layout router
│   │   ├── main.tsx         # Renderer main entry point
│   │   ├── index.css        # Global CSS & Tailwind configuration
│   │   ├── pages/           # Pages (Downloads, Library, Converter, Settings)
│   │   ├── layout/          # Sidebar navigation and header shell
│   │   └── stores/          # Zustand state management stores
│   └── types/               # Type definitions
```