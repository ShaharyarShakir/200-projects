import type { Context } from 'hono';
import { AIService } from './service.js';
import { summarizeSchema, explainSchema, rewriteSchema } from './schema';

export class AIController {
  static async summarize(c: Context) {
    const body = await c.req.json();
    const { content } = summarizeSchema.parse(body);

    const result = await AIService.summarize(content);

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