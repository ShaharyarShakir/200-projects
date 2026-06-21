import { spawn } from "child_process";
import { EventBus } from "../../core/event-bus";
import { downloadStore } from "./download.store";
import { DownloadRepo } from "../../db/download.repo";
import { SettingsRepo } from "../../db/settings.repo";
import path from "path";
import fs from "fs";

// Helper to convert units to bytes/sec
function convertToBytes(value: number, unit: string) {
  const multiplier: { [key: string]: number } = {
    "B": 1,
    "KB": 1024,
    "KiB": 1024,
    "MB": 1024 * 1024,
    "MiB": 1024 * 1024,
    "GB": 1024 * 1024 * 1024,
    "GiB": 1024 * 1024 * 1024,
  };
  return value * (multiplier[unit] || 1);
}

// Parse yt-dlp output for progress percentage and download speed
export function parseDownloadLine(line: string) {
  const speedMatch = line.match(/at\s+([\d.]+)([KMG]?i?B)\/s/);
  const progressMatch = line.match(/(\d+(\.\d+)?)%/);

  return {
    progress: progressMatch ? parseFloat(progressMatch[1]) : null,
    speed: speedMatch ? convertToBytes(Number(speedMatch[1]), speedMatch[2]) : null,
  };
}

// Helper to extract file path from yt-dlp output
function extractFilePath(msg: string): string | null {
  const mergerMatch = msg.match(/\[Merger\] Merging formats into "([^"]+)"/);
  if (mergerMatch) return mergerMatch[1].trim();

  const destMatch = msg.match(/\[download\] Destination:\s+(.+)/);
  if (destMatch) return destMatch[1].trim();

  const existsMatch = msg.match(/\[download\]\s+(.+?)\s+has already been downloaded/);
  if (existsMatch) return existsMatch[1].trim();

  const postMatch = msg.match(/\[VideoConvertor\] Replacing original file .+ with (.+)/);
  if (postMatch) return postMatch[1].trim();

  return null;
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}

export function startDownload(id: string, url: string) {
  downloadStore.add({
    id,
    url,
    status: "downloading",
    progress: 0,
    speed: 0,
  });

  const download = DownloadRepo.getById(id);
  const rawDownloadDir = SettingsRepo.get("downloadDir") || "downloads";
  const downloadDir = path.resolve(rawDownloadDir);

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  let outputFolder = downloadDir;
  if (download?.playlist_title) {
    outputFolder = path.join(downloadDir, sanitizeFolderName(download.playlist_title));
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }
  }

  let filenameTemplate = "%(title)s.%(ext)s";
  if (download?.title) {
    filenameTemplate = `${sanitizeFolderName(download.title)}.%(ext)s`;
  }

  const outputPathPattern = path.join(outputFolder, filenameTemplate);

  const args = [
    url,
    "-o",
    outputPathPattern,
    "--continue",
    "--no-part",
    "--newline",
  ];

  const quality = download?.quality;
  if (quality === "1080p") {
    args.push("-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]");
  } else if (quality === "720p") {
    args.push("-f", "bestvideo[height<=720]+bestaudio/best[height<=720]");
  }

  const process = spawn("yt-dlp", args);

  downloadStore.addProcess(id, process);

  downloadStore.update(id, {
    status: "downloading",
    pid: process.pid,
    speed: 0,
  });

  process.stdout.on("data", (data) => {
    const text = data.toString();
    const lines = text.split(/[\r\n]+/);

    for (const line of lines) {
      if (!line.trim()) continue;

      const filePath = extractFilePath(line);
      if (filePath) {
        const absolutePath = path.resolve(filePath);
        downloadStore.update(id, { outputPath: absolutePath });
      }

      const parsed = parseDownloadLine(line);
      if (parsed.progress !== null || parsed.speed !== null) {
        const current = downloadStore.get(id);
        const prevProgress = current?.progress ?? 0;
        const progress = parsed.progress !== null ? parsed.progress : prevProgress;
        const speed = parsed.speed !== null ? parsed.speed : (current?.speed ?? 0);

        downloadStore.update(id, { progress, speed });

        // Update database progress only on integer bounds
        if (Math.floor(progress) !== Math.floor(prevProgress)) {
          DownloadRepo.update(id, { progress });
        }

        EventBus.emit("download:progress", {
          id,
          progress,
          speed,
          status: "downloading",
        });

        EventBus.emit("download:metrics", {
          id,
          speed,
          progress,
          timestamp: Date.now(),
        });
      }
    }
  });

  process.on("close", (code) => {
    downloadStore.removeProcess(id);

    if (code === 0) {
      const item = downloadStore.get(id);
      const filePath = item?.outputPath || "";
      EventBus.emit("download:complete", { id, filePath });
    } else {
      const item = downloadStore.get(id);

      if (item?.status === "paused") {
        return; // paused intentionally → do NOT mark failed
      }

      EventBus.emit("download:failed", { id });
    }
  });
}
