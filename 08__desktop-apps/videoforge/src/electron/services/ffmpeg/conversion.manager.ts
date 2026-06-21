import path from "path";
import { ConversionJob } from "./conversion.types";
import { runConversion } from "./conversion.worker";
import { ConversionRepo } from "../../db/conversion.repo";

class ConversionManager {
  private active = false;

  add(job: ConversionJob) {
    // If it's already in the DB (e.g. from startup restoration), we don't insert it again.
    const existing = ConversionRepo.getById(job.id);
    if (!existing) {
      ConversionRepo.insert({
        id: job.id,
        input_path: job.inputPath,
        output_path: job.outputPath,
        format: job.format,
        progress: 0,
        status: "queued",
      });
    } else {
      // Just make sure it is in queued state
      ConversionRepo.update(job.id, { status: "queued", progress: 0 });
    }

    this.process();
  }

  // Restore queued/interrupted conversions on app startup
  restore() {
    const jobs = ConversionRepo.getAll();
    for (const job of jobs) {
      const updates: Partial<any> = {};
      let changed = false;

      if (job.status === "processing" || job.status === "queued") {
        updates.status = "queued";
        changed = true;
      }

      if (job.input_path && !path.isAbsolute(job.input_path)) {
        updates.input_path = path.resolve(job.input_path);
        changed = true;
      }

      if (job.output_path && !path.isAbsolute(job.output_path)) {
        updates.output_path = path.resolve(job.output_path);
        changed = true;
      }

      if (changed) {
        ConversionRepo.update(job.id, updates);
      }
    }
    this.process();
  }

  private async process() {
    if (this.active) return;

    const jobs = ConversionRepo.getAll();
    // find oldest queued job
    const nextJob = jobs.find((j) => j.status === "queued");

    if (!nextJob) return;

    this.active = true;

    const jobPayload: ConversionJob = {
      id: nextJob.id,
      inputPath: nextJob.input_path,
      outputPath: nextJob.output_path,
      format: nextJob.format as any,
      progress: nextJob.progress,
      status: "processing",
    };

    try {
      await runConversion(jobPayload);
    } finally {
      this.active = false;
      this.process();
    }
  }
}

export const conversionManager = new ConversionManager();
