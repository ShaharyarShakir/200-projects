import { spawn } from "child_process";
import { EventBus } from "../core/event-bus";
import { extractProgress } from "./extract-progress";

export function downloadVideo(url: string, quality?: string) {
  return new Promise((resolve, reject) => {
    const id = Date.now().toString();

    const args = [url, "-o", "downloads/%(title)s.%(ext)s", "--newline"];

    const process = spawn("yt-dlp", args);

    process.stdout.on("data", (data) => {
      const msg = data.toString();

      // parse progress (simplified)
      if (msg.includes("%")) {
        const percent = extractProgress(msg);

        EventBus.emit("download:progress", {
          id,
          percent,
        });
      }
    });

    process.on("close", (code) => {
      if (code === 0) {
        EventBus.emit("download:complete", {
          id,
          path: "downloads/",
        });

        resolve(id);
      } else {
        reject("Download failed");
      }
    });
  });
}
