interface Window {
  api: {
    startDownload: (
      url: string,
      format?: string,
      playlistId?: string,
      playlistTitle?: string,
      playlistIndex?: number,
      title?: string,
      quality?: string
    ) => Promise<string>;
    getPlaylist: (url: string) => Promise<any>;
    pauseDownload: (id: string) => Promise<void>;
    resumeDownload: (id: string) => Promise<void>;
    cancelDownload: (id: string) => Promise<void>;
    reorderDownloads: (ids: string[]) => Promise<void>;
    convertDownload: (job: any) => Promise<void>;
    getDownloads: () => Promise<any[]>;
    setConcurrency: (value: number) => Promise<void>;
    getConcurrency: () => Promise<number>;
    getSetting: (key: string) => Promise<string | undefined>;
    setSetting: (key: string, value: string) => Promise<void>;
    selectDirectory: () => Promise<string | null>;
    onProgress: (cb: (data: any) => void) => () => void;
    onMetrics: (cb: (data: any) => void) => () => void;
    getLibrary: () => Promise<any[]>;
    deleteLibraryItem: (id: string, deleteFileFromDisk: boolean) => Promise<void>;
    openFile: (filePath: string) => Promise<string>;
    openFolder: (filePath: string) => Promise<boolean>;
    reconvertLibraryItem: (id: string, format: string) => Promise<string>;
    onLibraryUpdate: (cb: (data: any) => void) => () => void;
    getConversions: () => Promise<any[]>;
    startConversion: (inputPath: string, format: string) => Promise<string>;
    deleteConversion: (id: string) => Promise<void>;
    onConversionProgress: (cb: (data: any) => void) => () => void;
  };
}

declare module "*.css" {
  const content: any;
  export default content;
}
