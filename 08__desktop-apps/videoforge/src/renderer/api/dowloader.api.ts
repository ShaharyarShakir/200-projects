export const downloaderAPI = {
  start: (url: string) => window.api.startDownload(url),

  pause: (id: string) => window.api.pauseDownload(id),

  resume: (id: string) => window.api.resumeDownload(id),

  cancel: (id: string) => window.api.cancelDownload(id),

  onProgress: (cb: (data: any) => void) => window.api.onProgress(cb),
};
