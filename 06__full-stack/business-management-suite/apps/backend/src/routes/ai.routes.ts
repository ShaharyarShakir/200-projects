import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware';

export const aiRoutes = new Hono();
aiRoutes.use('*', authMiddleware);

// POST /ai/analyze — analyze inventory trends, attendance patterns
aiRoutes.post('/analyze', async (c) => {
  const { type, data } = await c.req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this ${type} data and provide insights in JSON format with keys: summary, trends, recommendations, alerts.\n\nData: ${JSON.stringify(data)}`,
        },
      ],
    }),
  });

  const result = await response.json();
  return c.json({ analysis: result.content[0].text });
});

// POST /ai/chat — AI assistant for managers
aiRoutes.post('/chat', async (c) => {
  const { messages, context } = await c.req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a business management assistant. Context: ${JSON.stringify(context)}. Help with inventory, attendance, and customer questions.`,
      messages,
    }),
  });

  const result = await response.json();
  return c.json({ reply: result.content[0].text });
});
