import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export class FFmpegService {
  static convert(
    input: string,
    output: string,
    format: string,
    onProgress: (p: number) => void
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Ensure the output directory exists
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let cmd = ffmpeg(input);

      let baseFormat = format;
      let bitrate = "192k";
      if (format.startsWith("mp3_")) {
        baseFormat = "mp3";
        const parts = format.split("_");
        if (parts[1]) {
          bitrate = parts[1] + "k";
        }
      }

      if (baseFormat === "mp3") {
        cmd = cmd.toFormat("mp3").noVideo().audioCodec("libmp3lame").audioBitrate(bitrate);
      } else if (baseFormat === "mp4") {
        cmd = cmd.toFormat("mp4").videoCodec("libx264").audioCodec("aac");
      } else if (baseFormat === "webm") {
        cmd = cmd.toFormat("webm").videoCodec("libvpx").audioCodec("libvorbis");
      } else if (baseFormat === "mkv") {
        cmd = cmd.toFormat("matroska").videoCodec("libx264").audioCodec("aac");
      } else if (baseFormat === "hls") {
        cmd = cmd
          .toFormat("hls")
          .videoCodec("libx264")
          .audioCodec("aac")
          .addOption("-hls_time", "10")
          .addOption("-hls_list_size", "0")
          .addOption("-hls_segment_filename", path.join(outputDir, "segment_%03d.ts"));
      } else {
        cmd = cmd.toFormat(baseFormat);
      }

      cmd
        .on("progress", (progress) => {
          onProgress(progress.percent ?? 0);
        })
        .on("end", () => {
          resolve(true);
        })
        .on("error", (err) => {
          reject(err);
        })
        .save(output);
    });
  }
}
