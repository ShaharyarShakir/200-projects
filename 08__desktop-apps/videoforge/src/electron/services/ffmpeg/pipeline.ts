import { EventBus } from "../../core/event-bus";
import { conversionManager } from "./conversion.manager";
import { DownloadRepo } from "../../db/download.repo";
import path from "path";

export function initPipeline() {
  EventBus.on("download:complete", (data) => {
    const { id, filePath } = data;
    if (!filePath) return;

    // Fetch format from DownloadRepo
    const download = DownloadRepo.getById(id);
    if (!download) return;

    const format = (download as any).format || "mp4";
    if (format === "mp4") {
      // If target format is mp4, no conversion is needed
      return;
    }

    let baseFormat = format;
    if (format.startsWith("mp3_")) {
      baseFormat = "mp3";
    }

    const ext = path.extname(filePath);
    if (ext.replace(".", "").toLowerCase() === baseFormat.toLowerCase()) {
      return;
    }

    const outputPath = filePath.replace(ext, `.${baseFormat}`);

    conversionManager.add({
      id, // Using the SAME id as the download item to easily sync states in the React UI
      inputPath: filePath,
      outputPath: outputPath,
      format: format as any,
      progress: 0,
      status: "queued",
    });
  });
}
