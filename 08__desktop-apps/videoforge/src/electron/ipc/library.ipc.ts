import { IpcMain, shell } from "electron";
import path from "path";
import fs from "fs";
import { libraryService } from "../services/library/library.service";
import { MediaRepo } from "../db/media.repo";
import { DownloadRepo } from "../db/download.repo";
import { conversionManager } from "../services/ffmpeg/conversion.manager";

export function libraryIPC(ipcMain: IpcMain) {
    ipcMain.handle("library:getAll", async () => {
        return libraryService.getAll();
    });

    ipcMain.handle("library:delete", async (_, id: string, deleteFileFromDisk: boolean) => {
        return libraryService.deleteItem(id, deleteFileFromDisk);
    });

    ipcMain.handle("library:openFile", async (_, filePath: string) => {
        const resolvedPath = path.resolve(filePath);
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            return shell.openPath(resolvedPath);
        }
        return "File not found";
    });

    ipcMain.handle("library:openFolder", async (_, filePath: string) => {
        const resolvedPath = path.resolve(filePath);
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            shell.showItemInFolder(resolvedPath);
            return true;
        }
        return false;
    });

    ipcMain.handle("library:reconvert", async (_, id: string, targetFormat: "mp3" | "mp4" | "webm") => {
        const item = MediaRepo.getById(id);
        if (!item) {
            throw new Error("Media item not found");
        }

        const ext = path.extname(item.file_path);
        const outputDir = path.dirname(item.file_path);
        const baseName = path.basename(item.file_path, ext);
        const outputPath = path.join(outputDir, `${baseName}.${targetFormat}`);

        if (path.resolve(item.file_path) === path.resolve(outputPath)) {
            throw new Error("Target format matches source format");
        }

        const newId = Date.now().toString();

        // 1. Add placeholder to downloads repository so progress displays nicely in the React UI
        DownloadRepo.insert({
            id: newId,
            url: `Reconverting: ${path.basename(item.file_path)}`,
            status: "queued",
            progress: 0,
            position: DownloadRepo.getAll().length,
            format: targetFormat
        });

        // 2. Add to conversion manager
        conversionManager.add({
            id: newId,
            inputPath: item.file_path,
            outputPath: outputPath,
            format: targetFormat,
            progress: 0,
            status: "queued"
        });

        return newId;
    });
}
