import { db } from "./index";

export type DownloadRow = {
    id: string;
    url: string;
    status: string;
    progress: number;
    position: number;
    format?: string;
    title?: string | null;
    playlist_id?: string | null;
    playlist_title?: string | null;
    playlist_index?: number | null;
    quality?: string | null;
};

export class DownloadRepo {
    // Insert new download
    static insert(download: DownloadRow) {
        db.prepare(
            `INSERT INTO downloads
       (id, url, status, progress, position, format, title, playlist_id, playlist_title, playlist_index, quality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            download.id,
            download.url,
            download.status,
            download.progress,
            download.position,
            download.format || "mp4",
            download.title || null,
            download.playlist_id || null,
            download.playlist_title || null,
            download.playlist_index !== undefined ? download.playlist_index : null,
            download.quality || null
        );
    }

    // Get all downloads ordered (IMPORTANT for queue)
    static getAll() {
        return db
            .prepare(
                `SELECT * FROM downloads ORDER BY position ASC`
            )
            .all() as DownloadRow[];
    }

    // Get single download by ID
    static getById(id: string): DownloadRow | undefined {
        return db
            .prepare(`SELECT * FROM downloads WHERE id = ?`)
            .get(id) as DownloadRow | undefined;
    }

    // Update download
    static update(id: string, data: Partial<DownloadRow>) {
        const fields = Object.keys(data)
            .map((k) => `${k} = @${k}`)
            .join(", ");

        db.prepare(
            `UPDATE downloads SET ${fields} WHERE id = @id`
        ).run({ id, ...data });
    }

    // Reorder queue
    static reorder(ids: string[]) {
        const stmt = db.prepare(
            `UPDATE downloads SET position = ? WHERE id = ?`
        );

        const tx = db.transaction((list: string[]) => {
            list.forEach((id, index) => {
                stmt.run(index, id);
            });
        });

        tx(ids);
    }

    // Delete
    static delete(id: string) {
        db.prepare(`DELETE FROM downloads WHERE id = ?`).run(id);
    }
}