import { drizzle } from "drizzle-orm/bun-sqlite"
import { Database } from "bun:sqlite"
export const getTestDB = () => {
    const sqlite = new Database('test.sqlite')
    return drizzle(sqlite)
}