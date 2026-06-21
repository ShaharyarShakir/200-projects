import crypto from "crypto";
import fs from "fs";
import path from "path";
import { app } from "electron";
import ffmpeg from "fluent-ffmpeg";
import { MediaRepo, MediaRow } from "../../db/media.repo";
import { getMetadata } from "./metadata.service";
import { EventBus } from "../../core/event-bus";

// Helper to compute SHA-256 hash of a file using streams
function getFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(filePath);
        stream.on("data", (data) => hash.update(data));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", (err) => reject(err));
    });
}

// Helper to generate thumbnail for a video file
async function generateThumbnail(filePath: string, mediaId: string): Promise<string> {
    const thumbsFolder = path.join(app.getPath("userData"), "thumbnails");
    if (!fs.existsSync(thumbsFolder)) {
        fs.mkdirSync(thumbsFolder, { recursive: true });
    }

    return new Promise((resolve) => {
        ffmpeg(filePath)
            .screenshots({
                timestamps: ["10%"],
                filename: `${mediaId}.png`,
                folder: thumbsFolder,
                size: "320x180"
            })
            .on("end", () => {
                resolve(path.join(thumbsFolder, `${mediaId}.png`));
            })
            .on("error", (err) => {
                console.warn("Could not generate thumbnail (audio or no video stream):", err.message);
                resolve("");
            });
    });
}

export class LibraryService {
    async importFile(filePath: string): Promise<MediaRow | undefined> {
        try {
            const absolutePath = path.resolve(filePath);
            if (!fs.existsSync(absolutePath)) {
                console.error(`Import failed: File does not exist at path: ${absolutePath}`);
                return undefined;
            }

            // Check if file is already imported by looking up path
            const existingByPath = MediaRepo.getByPath(absolutePath);
            if (existingByPath) {
                console.log(`File already exists in library: ${absolutePath}`);
                return existingByPath;
            }

            // Compute file hash for duplicate detection
            const hash = await getFileHash(absolutePath);
            const existingByHash = MediaRepo.getByHash(hash);
            if (existingByHash) {
                console.log(`Duplicate file detected via SHA256 hash. Skipping insert. Existing path: ${existingByHash.file_path}`);
                return existingByHash;
            }

            // Get metadata
            let metadata: any;
            let videoStream: any;
            let media_type: "video" | "audio" = "video";
            let resolution = "";
            let duration = 0;
            let file_size = 0;

            try {
                metadata = await getMetadata(absolutePath);
                videoStream = metadata.streams.find((s: any) => s.codec_type === "video");
                media_type = videoStream ? "video" : "audio";
                resolution = videoStream ? `${videoStream.width}x${videoStream.height}` : "";
                duration = metadata.format.duration ? Math.round(Number(metadata.format.duration)) : 0;
                file_size = metadata.format.size ? Number(metadata.format.size) : 0;
            } catch (err: any) {
                console.warn(`ffprobe failed for ${absolutePath}:`, err.message);
                const stats = fs.existsSync(absolutePath) ? fs.statSync(absolutePath) : null;
                file_size = stats ? stats.size : 0;
                if (absolutePath.endsWith(".m3u8")) {
                    media_type = "video";
                }
            }
            
            const mediaId = crypto.randomUUID();
            let thumbnailPath = "";

            if (media_type === "video") {
                thumbnailPath = await generateThumbnail(absolutePath, mediaId);
            }

            const format = path.extname(absolutePath).replace(".", "").toLowerCase();
            const title = path.basename(absolutePath, path.extname(absolutePath));

            const mediaItem: MediaRow = {
                id: mediaId,
                title,
                file_path: absolutePath,
                thumbnail_path: thumbnailPath,
                duration,
                format,
                resolution,
                file_size,
                media_type,
                file_hash: hash
            };

            MediaRepo.insert(mediaItem);
            console.log(`Successfully imported media item: ${title} (${media_type})`);
            
            // Emit an event so UI can refresh library
            EventBus.emit("library:updated", mediaItem);

            return mediaItem;
        } catch (err: any) {
            console.error(`Failed to import file ${filePath}:`, err);
            return undefined;
        }
    }

    getAll(): MediaRow[] {
        return MediaRepo.getAll();
    }

    async deleteItem(id: string, deleteFileFromDisk = true) {
        const item = MediaRepo.getById(id);
        if (!item) return;

        // Delete from database
        MediaRepo.delete(id);

        // Delete thumbnail file
        if (item.thumbnail_path && fs.existsSync(item.thumbnail_path)) {
            try {
                fs.unlinkSync(item.thumbnail_path);
            } catch (err) {
                console.error("Failed to delete thumbnail file:", err);
            }
        }

        // Delete original file from disk if requested
        if (deleteFileFromDisk && item.file_path && fs.existsSync(item.file_path)) {
            try {
                fs.unlinkSync(item.file_path);
                console.log(`Deleted media file from disk: ${item.file_path}`);
            } catch (err) {
                console.error(`Failed to delete media file from disk at ${item.file_path}:`, err);
            }
        }
        
        EventBus.emit("library:updated", { id, deleted: true });
    }
}

export const libraryService = new LibraryService();
