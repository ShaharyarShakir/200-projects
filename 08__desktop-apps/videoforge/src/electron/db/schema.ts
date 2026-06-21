import { db } from "./index";

export function initSchema() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL,
      progress REAL DEFAULT 0,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      format TEXT DEFAULT 'mp4',
      title TEXT,
      playlist_id TEXT,
      playlist_title TEXT,
      playlist_index INTEGER,
      quality TEXT
    );
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

    try {
        db.exec(`ALTER TABLE downloads ADD COLUMN format TEXT DEFAULT 'mp4';`);
    } catch (err) {
        // Column already exists, ignore
    }

    try {
        db.exec(`ALTER TABLE downloads ADD COLUMN title TEXT;`);
    } catch (err) {
        // Column already exists, ignore
    }

    try {
        db.exec(`ALTER TABLE downloads ADD COLUMN playlist_id TEXT;`);
    } catch (err) {
        // Column already exists, ignore
    }

    try {
        db.exec(`ALTER TABLE downloads ADD COLUMN playlist_title TEXT;`);
    } catch (err) {
        // Column already exists, ignore
    }

    try {
        db.exec(`ALTER TABLE downloads ADD COLUMN playlist_index INTEGER;`);
    } catch (err) {
        // Column already exists, ignore
    }

    try {
        db.exec(`ALTER TABLE downloads ADD COLUMN quality TEXT;`);
    } catch (err) {
        // Column already exists, ignore
    }

    db.exec(`
    CREATE TABLE IF NOT EXISTS conversions (
      id TEXT PRIMARY KEY,
      input_path TEXT NOT NULL,
      output_path TEXT NOT NULL,
      format TEXT NOT NULL,
      progress REAL DEFAULT 0,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      file_path TEXT UNIQUE NOT NULL,
      thumbnail_path TEXT,
      duration INTEGER DEFAULT 0,
      format TEXT NOT NULL,
      resolution TEXT,
      file_size INTEGER DEFAULT 0,
      media_type TEXT NOT NULL,
      file_hash TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}