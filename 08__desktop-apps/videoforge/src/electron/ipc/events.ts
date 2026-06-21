import { BrowserWindow } from "electron";
import { EventBus } from "../core/event-bus";

export function registerEvents(win: BrowserWindow) {
  EventBus.on("download:progress", (data) => {
    win.webContents.send("download:progress", data);
  });

  EventBus.on("download:complete", (data) => {
    win.webContents.send("download:complete", data);
  });
}
