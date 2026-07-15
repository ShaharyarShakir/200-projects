import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export class ChatAgent {
  constructor(private model: BaseChatModel) {}

  async *chatStream(params: {
    message: string;
    chatHistory?: { role: "user" | "assistant"; content: string }[];
    ragContext?: string;
    diagramContext?: string;
    longTermPreferences?: string;
  }): AsyncGenerator<string, void, unknown> {
    const systemPrompt = `You are a helpful software architect assistant integrated inside a collaborative engineering workspace.
You can answer questions about the current diagrams, database schema, normalize schemas, convert PostgreSQL to Prisma/Drizzle, suggest indexes, and explain system architecture.

User Preferences & Style:
{preferences}

Workspace RAG (Semantic Search Context):
{ragContext}

Current Diagram Shapes (on canvas):
{diagramContext}

Answer the user query accurately based on the contexts. Use Markdown blocks for code, tables, and lists.`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      new MessagesPlaceholder("history"),
      ["user", "{input}"],
    ]);

    // Convert simple history format to BaseMessage format
    const chatHistory: BaseMessage[] = (params.chatHistory || []).map((h) => {
      if (h.role === "user") {
        return new HumanMessage(h.content);
      } else {
        return new AIMessage(h.content);
      }
    });

    const formattedPrompt = await promptTemplate.formatMessages({
      preferences: params.longTermPreferences || "None configured",
      ragContext: params.ragContext || "No matching reference notes found",
      diagramContext: params.diagramContext || "Empty diagram canvas",
      history: chatHistory,
      input: params.message,
    });

    const stream = await this.model.stream(formattedPrompt);
    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }
}
