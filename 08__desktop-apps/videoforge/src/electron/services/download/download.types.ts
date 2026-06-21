export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed";

export interface DownloadItem {
  id: string;
  url: string;

  status: DownloadStatus;
  progress: number;

  speed: number; // bytes/sec

  outputPath?: string;
  pid?: number; // process id
  tempFile?: string; // .part file tracking

  eta?: number;
  downloadedBytes?: number;
  totalBytes?: number;

  format?: string;
  title?: string;
  playlistId?: string;
  playlistTitle?: string;
  playlistIndex?: number;
  quality?: string;
}
