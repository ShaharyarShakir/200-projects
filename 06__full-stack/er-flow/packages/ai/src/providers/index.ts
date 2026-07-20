import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Embeddings } from "@langchain/core/embeddings";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";

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
      model: config?.modelName || "qwen2.5-coder:1.5b",
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

export class GroqProvider implements AIProvider {
  private apiKey: string;
  private ollamaProvider: OllamaProvider;
  private defaultModel: string;

  constructor(apiKey: string, ollamaHost?: string) {
    this.apiKey = apiKey;
    this.ollamaProvider = new OllamaProvider(ollamaHost);
    this.defaultModel = process.env.GROQ_MODEL || "llama-3.3-70b-specdec";
  }

  getChatModel(config?: { modelName?: string; temperature?: number }): BaseChatModel {
    const mainModelName = config?.modelName || this.defaultModel;
    const groqModel = new ChatGroq({
      apiKey: this.apiKey,
      model: mainModelName,
      temperature: config?.temperature ?? 0.2,
    });

    const fallbackModel = this.ollamaProvider.getChatModel({
      modelName: process.env.FALLBACK_CHAT_MODEL || "qwen2.5-coder:1.5b",
      temperature: config?.temperature ?? 0.2,
    });

    return groqModel.withFallbacks({
      fallbacks: [fallbackModel],
    }) as unknown as BaseChatModel;
  }

  getEmbeddings(config?: { modelName?: string }): Embeddings {
    return this.ollamaProvider.getEmbeddings(config);
  }
}

export function getProvider(providerType: string, host?: string): AIProvider {
  if (providerType === "groq") {
    const apiKey = process.env.GROQ_API_KEY || "";
    return new GroqProvider(apiKey, host);
  }
  return new OllamaProvider(host);
}
