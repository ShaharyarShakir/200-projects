import { IpcMain } from "electron";
import { downloadVideo } from "../services/download-manager";
import { DownloadRepo } from "../db/download.repo";

export function downloaderIPC(ipcMain: IpcMain) {
  ipcMain.handle("download:start", async (_, payload) => {
    return downloadVideo(payload.url, payload.quality);
  });

  ipcMain.handle("download:reorder", (_, ids: string[]) => {
    DownloadRepo.reorder(ids);
  });
}
