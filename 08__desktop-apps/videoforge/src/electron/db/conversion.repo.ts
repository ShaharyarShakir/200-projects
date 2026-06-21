import { db } from "./index";

export type ConversionRow = {
    id: string;
    input_path: string;
    output_path: string;
    format: string;
    progress: number;
    status: string;
};

export class ConversionRepo {
    // Insert conversion job
    static insert(job: ConversionRow) {
        db.prepare(
            `INSERT INTO conversions
       (id, input_path, output_path, format, progress, status)
       VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
            job.id,
            job.input_path,
            job.output_path,
            job.format,
            job.progress,
            job.status
        );
    }

    // Get all conversion jobs ordered by creation date
    static getAll() {
        return db
            .prepare(`SELECT * FROM conversions ORDER BY created_at ASC`)
            .all() as ConversionRow[];
    }

    // Get a conversion job by its ID
    static getById(id: string): ConversionRow | undefined {
        return db
            .prepare(`SELECT * FROM conversions WHERE id = ?`)
            .get(id) as ConversionRow | undefined;
    }

    // Update conversion job status or progress
    static update(id: string, data: Partial<ConversionRow>) {
        const fields = Object.keys(data)
            .map((k) => `${k} = @${k}`)
            .join(", ");

        db.prepare(
            `UPDATE conversions SET ${fields} WHERE id = @id`
        ).run({ id, ...data });
    }

    // Delete a conversion job
    static delete(id: string) {
        db.prepare(`DELETE FROM conversions WHERE id = ?`).run(id);
    }
}
