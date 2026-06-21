import { ipcMain } from "electron";
import { downloaderIPC } from "../services/download/download.ipc";
import { converterIPC } from "../ipc/converter.ipc";
import { libraryIPC } from "../ipc/library.ipc";
import { playlistIPC } from "../ipc/playlist.ipc";

export function registerIPC() {
  downloaderIPC(ipcMain);
  converterIPC(ipcMain);
  libraryIPC(ipcMain);
  playlistIPC(ipcMain);
}
