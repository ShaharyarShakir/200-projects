import { DownloadRepo } from "../../db/download.repo";
import { SettingsRepo } from "../../db/settings.repo";
import { startDownload } from "./download.worker";
import { EventBus } from "../../core/event-bus";
import { downloadStore } from "./download.store";

class DownloadManager {
  private maxConcurrent = 4;
  private settingsLoaded = false;

  constructor() {
    // Subscribe to completion and failure events to process the queue
    EventBus.on("download:complete", (data) => {
      const download = DownloadRepo.getById(data.id);
      // If no conversion is scheduled (mp4), mark completed immediately
      if (download && download.format === "mp4") {
        DownloadRepo.update(data.id, { status: "completed", progress: 100 });
        EventBus.emit("download:progress", {
          id: data.id,
          progress: 100,
          status: "completed",
        });
      }
      this.process();
    });

    EventBus.on("download:failed", (data) => {
      DownloadRepo.update(data.id, { status: "failed" });
      this.process();
    });
  }

  private ensureSettingsLoaded() {
    if (this.settingsLoaded) return;
    try {
      const saved = SettingsRepo.get("downloadConcurrency");
      if (saved) {
        this.maxConcurrent = parseInt(saved, 10);
      }
      this.settingsLoaded = true;
    } catch (err) {
      console.warn("Failed to load settings (might be before schema init):", err);
    }
  }

  process() {
    this.ensureSettingsLoaded();
    const downloads = DownloadRepo.getAll();

    // Active means currently downloading or converting
    const active = downloads.filter(
      (d) => d.status === "downloading" || d.status === "converting"
    );

    if (active.length < this.maxConcurrent) {
      const queued = downloads.filter((d) => d.status === "queued");
      const slots = this.maxConcurrent - active.length;
      const toStart = queued.slice(0, slots);

      for (const item of toStart) {
        DownloadRepo.update(item.id, { status: "downloading" });
        EventBus.emit("download:progress", {
          id: item.id,
          status: "downloading",
          progress: item.progress || 0,
        });
        startDownload(item.id, item.url);
      }
    }
  }

  add(
    url: string,
    format?: string,
    playlistId?: string,
    playlistTitle?: string,
    playlistIndex?: number,
    title?: string,
    quality?: string
  ) {
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const existing = DownloadRepo.getAll();
    const position = existing.length;

    DownloadRepo.insert({
      id,
      url,
      status: "queued",
      progress: 0,
      position,
      format: format || "mp4",
      title: title || null,
      playlist_id: playlistId || null,
      playlist_title: playlistTitle || null,
      playlist_index: playlistIndex !== undefined ? playlistIndex : null,
      quality: quality || null,
    });

    this.process();

    return id;
  }

  pause(id: string) {
    const process = downloadStore.getProcess(id);
    if (process) {
      // Set memory state first so stdout / close handles don't overwrite or fail it
      downloadStore.update(id, { status: "paused" });
      process.kill("SIGTERM");
      downloadStore.removeProcess(id);
    }

    DownloadRepo.update(id, {
      status: "paused",
    });

    this.process();
  }

  resume(id: string) {
    const download = DownloadRepo.getById(id);
    if (!download) return;

    DownloadRepo.update(id, {
      status: "queued",
    });

    this.process();
  }

  remove(id: string) {
    const process = downloadStore.getProcess(id);
    if (process) {
      process.kill("SIGTERM");
      downloadStore.removeProcess(id);
    }

    DownloadRepo.delete(id);
    this.process();
  }

  setConcurrency(value: number) {
    this.maxConcurrent = value;
    this.settingsLoaded = true;
    SettingsRepo.set("downloadConcurrency", value.toString());
    this.process();
  }

  getConcurrency(): number {
    this.ensureSettingsLoaded();
    return this.maxConcurrent;
  }
}

export const downloadManager = new DownloadManager();