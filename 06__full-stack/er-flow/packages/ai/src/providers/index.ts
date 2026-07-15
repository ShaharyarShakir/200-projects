import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Embeddings } from "@langchain/core/embeddings";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";

export interface AIProvider {
  getChatModel(config?: { modelName?: string; temperature?: number }): BaseChatModel;
  getEmbeddings(config?: { modelName?: string }): Embeddings;
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  getChatModel(config?: { modelName?: string; temperature?: number }): BaseChatModel {
    return new ChatOllama({
      baseUrl: this.baseUrl,
      model: config?.modelName || "deepseek-coder:1.3b",
      temperature: config?.temperature ?? 0.2,
    });
  }

  getEmbeddings(config?: { modelName?: string }): Embeddings {
    return new OllamaEmbeddings({
      baseUrl: this.baseUrl,
      model: config?.modelName || "nomic-embed-text:latest",
    });
  }
}

export function getProvider(providerType: string, host?: string): AIProvider {
  if (providerType === "ollama") {
    return new OllamaProvider(host);
  }
  return new OllamaProvider(host);
}
