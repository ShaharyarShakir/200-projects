import { ChatPromptTemplate } from '@langchain/core/prompts';
import { groq } from './groq.js';

export async function runPrompt(template: string, variables: Record<string, string>) {
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are an AI assistant for a note-taking app.'],
    ['human', template],
  ]);

  const chain = prompt.pipe(groq);
  const result = await chain.invoke(variables);

  return result.content.toString();
}