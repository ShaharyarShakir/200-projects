import type { Context } from 'hono';
import { AIService } from './service.js';
import { summarizeSchema, explainSchema, rewriteSchema } from './schema.js';
import { db, note, eq, and } from '@repo/database';

export class AIController {
  static async summarize(c: Context) {
    const body = await c.req.json();
    const { content, noteId } = summarizeSchema.parse(body);

    const result = await AIService.summarize(content);

    if (noteId) {
      const user = (c as any).get("user");
      if (user && user.id) {
        await db
          .update(note)
          .set({ summary: result })
          .where(and(eq(note.id, noteId), eq(note.userId, user.id)));
      }
    }

    return c.json({ success: true, data: result });
  }

  static async explain(c: Context) {
    const body = await c.req.json();
    const { content } = explainSchema.parse(body);

    const result = await AIService.explain(content);

    return c.json({ success: true, data: result });
  }

  static async rewrite(c: Context) {
    const body = await c.req.json();
    const { content, style } = rewriteSchema.parse(body);

    const result = await AIService.rewrite(content, style);

    return c.json({ success: true, data: result });
  }
}