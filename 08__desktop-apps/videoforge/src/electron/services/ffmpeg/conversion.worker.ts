import { FFmpegService } from "./ffmpeg.service";
import { ConversionJob } from "./conversion.types";
import { EventBus } from "../../core/event-bus";
import { ConversionRepo } from "../../db/conversion.repo";
import { DownloadRepo } from "../../db/download.repo";

export async function runConversion(job: ConversionJob) {
  const isDownload = !!DownloadRepo.getById(job.id);

  // Update state in DB and EventBus
  ConversionRepo.update(job.id, { status: "processing" });
  EventBus.emit("conversion:progress", { id: job.id, progress: 0, status: "processing" });
  
  if (isDownload) {
    // Also update downloads table status to 'converting'
    DownloadRepo.update(job.id, { status: "converting", progress: 0 });
    EventBus.emit("download:progress", { id: job.id, progress: 0, status: "converting" });
  }

  try {
    await FFmpegService.convert(
      job.inputPath,
      job.outputPath,
      job.format,
      (progress) => {
        const roundedProgress = Math.round(progress);
        ConversionRepo.update(job.id, { progress: roundedProgress });
        EventBus.emit("conversion:progress", {
          id: job.id,
          progress: roundedProgress,
          status: "processing",
        });
        
        if (isDownload) {
          // Update downloads table progress
          DownloadRepo.update(job.id, { progress: roundedProgress });
          EventBus.emit("download:progress", {
            id: job.id,
            progress: roundedProgress,
            status: "converting",
          });
        }
      }
    );

    // Completed
    ConversionRepo.update(job.id, { status: "completed", progress: 100 });
    EventBus.emit("conversion:progress", {
      id: job.id,
      progress: 100,
      status: "completed",
    });
    EventBus.emit("conversion:complete", { id: job.id, filePath: job.outputPath });
    
    if (isDownload) {
      DownloadRepo.update(job.id, { status: "completed", progress: 100 });
      EventBus.emit("download:progress", {
        id: job.id,
        progress: 100,
        status: "completed",
      });
      EventBus.emit("download:complete", { id: job.id, filePath: job.outputPath });
    }
  } catch (err) {
    console.error("Conversion failed:", err);
    ConversionRepo.update(job.id, { status: "failed" });
    EventBus.emit("conversion:progress", {
      id: job.id,
      progress: 0,
      status: "failed",
    });
    
    if (isDownload) {
      DownloadRepo.update(job.id, { status: "failed" });
      EventBus.emit("download:progress", {
        id: job.id,
        progress: 0,
        status: "failed",
      });
    }
  }
}
