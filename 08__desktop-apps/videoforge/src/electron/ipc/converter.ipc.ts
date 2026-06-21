import { IpcMain } from "electron";
import path from "path";
import { conversionManager } from "../services/ffmpeg/conversion.manager";
import { ConversionRepo } from "../db/conversion.repo";

export function converterIPC(ipcMain: IpcMain) {
  ipcMain.handle("convert:start", (_, inputPath: string, format: string) => {
    const id = Date.now().toString();
    const ext = path.extname(inputPath);
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, ext);

    let outputPath: string;
    if (format === "hls") {
      outputPath = path.join(outputDir, `${baseName}_hls`, `${baseName}.m3u8`);
    } else {
      outputPath = path.join(outputDir, `${baseName}.${format}`);
    }

    conversionManager.add({
      id,
      inputPath,
      outputPath,
      format: format as any,
      progress: 0,
      status: "queued",
    });

    return id;
  });

  ipcMain.handle("convert:getAll", () => {
    return ConversionRepo.getAll();
  });

  ipcMain.handle("convert:delete", (_, id: string) => {
    ConversionRepo.delete(id);
    return true;
  });
}
