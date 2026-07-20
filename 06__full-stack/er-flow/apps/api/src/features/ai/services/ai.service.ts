import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  getProvider,
  GraphAgent,
  SchemaAgent,
  DocumentAgent,
  ChatAgent,
} from "@eraser/ai";
import { RagService } from "./rag.service.js";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private providerType: string;
  private ollamaHost: string;
  private chatModelName: string;

  constructor(
    private configService: ConfigService,
    private ragService: RagService
  ) {
    this.providerType = this.configService.get<string>("AI_PROVIDER") || "ollama";
    this.ollamaHost = this.configService.get<string>("OLLAMA_HOST") || "http://localhost:11434";
    this.chatModelName = this.configService.get<string>("DEFAULT_CHAT_MODEL") || "qwen2.5-coder:1.5b";
  }

  async generateDiagram(prompt: string, currentContext?: string) {
    this.logger.log(`Generating diagram with prompt: "${prompt}"`);
    const provider = getProvider(this.providerType, this.ollamaHost);
    const chatModel = provider.getChatModel({ modelName: this.chatModelName });
    const graphAgent = new GraphAgent(chatModel);
    
    return graphAgent.generate(prompt, currentContext);
  }

  async explainSchema(schemaAstJson: string) {
    this.logger.log("Explaining schema AST");
    const provider = getProvider(this.providerType, this.ollamaHost);
    const chatModel = provider.getChatModel({ modelName: this.chatModelName });
    const schemaAgent = new SchemaAgent(chatModel);

    return schemaAgent.explainSchema(schemaAstJson);
  }

  async *chatStream(params: {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    workspaceId: string;
    documentId?: string;
    diagramContext?: string;
  }): AsyncGenerator<string, void, unknown> {
    this.logger.log(`Streaming chat for prompt: "${params.message}"`);
    const provider = getProvider(this.providerType, this.ollamaHost);
    const chatModel = provider.getChatModel({ modelName: this.chatModelName });
    const chatAgent = new ChatAgent(chatModel);

    // Retrieve related RAG context
    let ragContext = "";
    if (params.workspaceId) {
      try {
        ragContext = await this.ragService.searchWorkspace(params.workspaceId, params.message);
      } catch (err) {
        this.logger.error("RAG search failed, continuing without search context:", err);
      }
    }

    const stream = chatAgent.chatStream({
      message: params.message,
      chatHistory: params.history,
      ragContext,
      diagramContext: params.diagramContext,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
