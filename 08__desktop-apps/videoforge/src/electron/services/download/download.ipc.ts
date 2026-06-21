import { IpcMain, dialog, BrowserWindow } from "electron";
import { downloadManager } from "./download.manager";
import { DownloadRepo } from "../../db/download.repo";
import { SettingsRepo } from "../../db/settings.repo";

export function downloaderIPC(ipcMain: IpcMain) {
  ipcMain.handle("download:start", (_, url, format, playlistId, playlistTitle, playlistIndex, title, quality) => {
    return downloadManager.add(url, format, playlistId, playlistTitle, playlistIndex, title, quality);
  });

  ipcMain.handle("download:pause", (_, id) => {
    downloadManager.pause(id);
  });

  ipcMain.handle("download:resume", (_, id) => {
    downloadManager.resume(id);
  });

  ipcMain.handle("download:cancel", (_, id) => {
    downloadManager.remove(id);
  });

  ipcMain.handle("download:reorder", (_, ids: string[]) => {
    DownloadRepo.reorder(ids);
  });

  ipcMain.handle("download:getAll", () => {
    return DownloadRepo.getAll();
  });

  ipcMain.handle("settings:setConcurrency", (_, value: number) => {
    downloadManager.setConcurrency(value);
  });

  ipcMain.handle("settings:getConcurrency", () => {
    return downloadManager.getConcurrency();
  });

  ipcMain.handle("settings:get", (_, key: string) => {
    return SettingsRepo.get(key);
  });

  ipcMain.handle("settings:set", (_, key: string, value: string) => {
    SettingsRepo.set(key, value);
    if (key === "downloadConcurrency") {
      downloadManager.setConcurrency(parseInt(value, 10));
    }
  });

  ipcMain.handle("settings:selectDirectory", async () => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
}