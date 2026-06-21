export type IPCChannels = {
  "download:start": {
    url: string;
    quality?: string;
  };

  "download:progress": {
    id: string;
    percent: number;
    speed?: string;
  };

  "download:complete": {
    id: string;
    path: string;
  };

  "convert:video": {
    input: string;
    format: "mp4" | "mp3" | "webm" | "hls";
  };
};
