export type ConversionFormat = "mp3" | "mp4" | "webm" | "mkv" | "hls";

export interface ConversionJob {
  id: string;
  inputPath: string;
  outputPath: string;
  format: ConversionFormat;
  progress: number;
  status: "queued" | "processing" | "completed" | "failed";
}
