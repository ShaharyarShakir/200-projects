import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

const dbPath = path.join(app.getPath("userData"), "videoforge.db");

export const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma("journal_mode = WAL");