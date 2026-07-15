import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export class DocumentAgent {
  constructor(private model: BaseChatModel) {}

  async summarize(documentContent: string): Promise<string> {
    const systemPrompt = `You are a professional technical writer.
Summarize the following document content concisely. Include key takeaways, primary design or architecture goals, and an overview of the system described.
Use bullet points and high-contrast Markdown formatting for readability.`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "Content to summarize:\n{content}"],
    ]);

    const formattedPrompt = await promptTemplate.formatMessages({
      content: documentContent,
    });

    const result = await this.model.invoke(formattedPrompt);
    return result.content.toString();
  }

  async rewrite(documentContent: string, instruction: string): Promise<string> {
    const systemPrompt = `You are a senior technical editor.
Rewrite the provided document content according to the following instruction: "{instruction}".
Maintain precision and technical consistency. Do not add chat preamble. Return only the revised content.`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "Original Content:\n{content}"],
    ]);

    const formattedPrompt = await promptTemplate.formatMessages({
      content: documentContent,
      instruction,
    });

    const result = await this.model.invoke(formattedPrompt);
    return result.content.toString();
  }
}
