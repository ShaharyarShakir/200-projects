import { db } from "./index";

export type MediaRow = {
    id: string;
    title: string;
    file_path: string;
    thumbnail_path: string;
    duration: number;
    format: string;
    resolution: string;
    file_size: number;
    media_type: string; // 'video' | 'audio'
    file_hash: string;
    created_at?: string;
    is_converted?: number | boolean;
};

export class MediaRepo {
    static insert(media: MediaRow) {
        db.prepare(
            `INSERT OR IGNORE INTO media
       (id, title, file_path, thumbnail_path, duration, format, resolution, file_size, media_type, file_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            media.id,
            media.title,
            media.file_path,
            media.thumbnail_path,
            media.duration,
            media.format,
            media.resolution,
            media.file_size,
            media.media_type,
            media.file_hash
        );
    }

    static getAll(): MediaRow[] {
        return db
            .prepare(
                `SELECT m.*, EXISTS(SELECT 1 FROM conversions c WHERE c.output_path = m.file_path) as is_converted
         FROM media m
         ORDER BY m.created_at DESC`
            )
            .all() as MediaRow[];
    }

    static getById(id: string): MediaRow | undefined {
        return db
            .prepare(`SELECT * FROM media WHERE id = ?`)
            .get(id) as MediaRow | undefined;
    }

    static getByHash(hash: string): MediaRow | undefined {
        return db
            .prepare(`SELECT * FROM media WHERE file_hash = ?`)
            .get(hash) as MediaRow | undefined;
    }

    static getByPath(filePath: string): MediaRow | undefined {
        return db
            .prepare(`SELECT * FROM media WHERE file_path = ?`)
            .get(filePath) as MediaRow | undefined;
    }

    static delete(id: string) {
        db.prepare(`DELETE FROM media WHERE id = ?`).run(id);
    }
}
