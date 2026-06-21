import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  startDownload: (
    url: string,
    format?: string,
    playlistId?: string,
    playlistTitle?: string,
    playlistIndex?: number,
    title?: string,
    quality?: string
  ) =>
    ipcRenderer.invoke(
      "download:start",
      url,
      format,
      playlistId,
      playlistTitle,
      playlistIndex,
      title,
      quality
    ),

  getPlaylist: (url: string) =>
    ipcRenderer.invoke("playlist:get", url),

  pauseDownload: (id: string) =>
    ipcRenderer.invoke("download:pause", id),

  resumeDownload: (id: string) =>
    ipcRenderer.invoke("download:resume", id),

  cancelDownload: (id: string) =>
    ipcRenderer.invoke("download:cancel", id),

  reorderDownloads: (ids: string[]) =>
    ipcRenderer.invoke("download:reorder", ids),

  convertDownload: (job: any) =>
    ipcRenderer.invoke("convert:start", job),

  getDownloads: () =>
    ipcRenderer.invoke("download:getAll"),

  setConcurrency: (value: number) =>
    ipcRenderer.invoke("settings:setConcurrency", value),

  getConcurrency: () =>
    ipcRenderer.invoke("settings:getConcurrency"),

  getSetting: (key: string) =>
    ipcRenderer.invoke("settings:get", key),

  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke("settings:set", key, value),

  selectDirectory: () =>
    ipcRenderer.invoke("settings:selectDirectory"),

  onProgress: (cb: (data: any) => void) => {
    const listener = (_: any, data: any) => cb(data);
    ipcRenderer.on("download:progress", listener);
    return () => {
      ipcRenderer.off("download:progress", listener);
    };
  },

  onMetrics: (cb: (data: any) => void) => {
    const listener = (_: any, data: any) => cb(data);
    ipcRenderer.on("download:metrics", listener);
    return () => {
      ipcRenderer.off("download:metrics", listener);
    };
  },

  getLibrary: () =>
    ipcRenderer.invoke("library:getAll"),

  deleteLibraryItem: (id: string, deleteFileFromDisk: boolean) =>
    ipcRenderer.invoke("library:delete", id, deleteFileFromDisk),

  openFile: (filePath: string) =>
    ipcRenderer.invoke("library:openFile", filePath),

  openFolder: (filePath: string) =>
    ipcRenderer.invoke("library:openFolder", filePath),

  reconvertLibraryItem: (id: string, format: string) =>
    ipcRenderer.invoke("library:reconvert", id, format),

  onLibraryUpdate: (cb: (data: any) => void) => {
    const listener = (_: any, data: any) => cb(data);
    ipcRenderer.on("library:updated", listener);
    return () => {
      ipcRenderer.off("library:updated", listener);
    };
  },

  getConversions: () =>
    ipcRenderer.invoke("convert:getAll"),

  startConversion: (inputPath: string, format: string) =>
    ipcRenderer.invoke("convert:start", inputPath, format),

  deleteConversion: (id: string) =>
    ipcRenderer.invoke("convert:delete", id),

  onConversionProgress: (cb: (data: any) => void) => {
    const listener = (_: any, data: any) => cb(data);
    ipcRenderer.on("conversion:progress", listener);
    return () => {
      ipcRenderer.off("conversion:progress", listener);
    };
  },
});