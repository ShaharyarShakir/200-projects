import { app, BrowserWindow, protocol, net } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import started from "electron-squirrel-startup";
import { EventBus } from "./core/event-bus";
import { registerIPC } from "./core/ipc-server";
import { initSchema } from "./db/schema";
import { downloadManager } from "./services/download/download.manager";
import { DownloadRepo } from "./db/download.repo";
import { initPipeline } from "./services/ffmpeg/pipeline";
import { conversionManager } from "./services/ffmpeg/conversion.manager";
import { libraryService } from "./services/library/library.service";

// Register custom media scheme for local file playback
protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  registerEvents(mainWindow);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // Handle media:// file URL protocol
  protocol.handle("media", (request) => {
    try {
      const urlObj = new URL(request.url);
      let filePath = decodeURIComponent(urlObj.pathname);
      if (process.platform === "win32") {
        if (filePath.startsWith("/")) {
          filePath = filePath.slice(1);
        }
      }
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (err) {
      console.error("Custom protocol error:", err);
      return new Response("Bad Request", { status: 400 });
    }
  });

  registerIPC();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

export function registerEvents(win: BrowserWindow) {
  EventBus.on("download:progress", (data) => {
    win.webContents.send("download:progress", data);
  });

  EventBus.on("download:complete", (data) => {
    win.webContents.send("download:complete", data);
  });

  EventBus.on("download:metrics", (data) => {
    win.webContents.send("download:metrics", data);
  });

  EventBus.on("library:updated", (data) => {
    win.webContents.send("library:updated", data);
  });

  EventBus.on("conversion:progress", (data) => {
    win.webContents.send("conversion:progress", data);
  });
}

app.whenReady().then(() => {
  initSchema();
  initPipeline();
  conversionManager.restore();

  // Auto-import completed downloads / conversions
  EventBus.on("download:complete", async (data) => {
    const { id, filePath } = data;
    if (!filePath) return;

    // We only import once the download status in the repository changes to completed
    const download = DownloadRepo.getById(id);
    if (download && download.status === "completed") {
      await libraryService.importFile(filePath);
    }
  });

  EventBus.on("conversion:complete", async (data) => {
    const { filePath } = data;
    if (filePath) {
      await libraryService.importFile(filePath);
    }
  });

  const downloads = DownloadRepo.getAll();

  for (const d of downloads) {
    if (d.status === "downloading") {
      // Mark as queued on start so the manager processes them up to the concurrency limit
      DownloadRepo.update(d.id, { status: "queued" });
    }
  }

  // Start processing the download queue
  downloadManager.process();
});