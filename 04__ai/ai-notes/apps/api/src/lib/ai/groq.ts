import { ChatGroq } from '@langchain/groq';

export const groq = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  temperature: 0.3,
});