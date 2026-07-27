import { runPrompt } from "@/lib/ai/chains.js";
import { EXPLAIN_PROMPT, REWRITE_PROMPT, SUMMARIZE_PROMPT } from "@/lib/ai/prompts.js";


export class AIService {
  static async summarize(content: string) {
    return runPrompt(SUMMARIZE_PROMPT, { content });
  }

  static async explain(content: string) {
    return runPrompt(EXPLAIN_PROMPT, { content });
  }

  static async rewrite(content: string, style: string) {
    return runPrompt(REWRITE_PROMPT, { content, style });
  }
}