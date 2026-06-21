import { IpcMain } from "electron";
import { getPlaylist } from "../services/playlist/playlist.service";

export function playlistIPC(ipcMain: IpcMain) {
  ipcMain.handle("playlist:get", async (_, url: string) => {
    return getPlaylist(url);
  });
}
