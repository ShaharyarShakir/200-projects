import { Hono } from "hono";
import { sql } from "drizzle-orm";

import { db } from "@repo/database";

const router = new Hono();

router.get("/", async (c) => {
  const result = await db.execute(sql`SELECT NOW()` as any);

  return c.json(result);
});

export default router;
