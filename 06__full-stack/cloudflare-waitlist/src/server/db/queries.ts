import type { D1Database } from "@cloudflare/workers-types";
import type { NewSubscriber } from "./schema";
import { getDB } from "./db";
import * as schema from "./schema"

export const insertSubscriber = async (
    d1Database: D1Database,
    newSubscriber: NewSubscriber
) => {
    const db = getDB(d1Database)
    const [result] = await db.insert(schema.subscribers).values(newSubscriber).returning()
    return result
}
