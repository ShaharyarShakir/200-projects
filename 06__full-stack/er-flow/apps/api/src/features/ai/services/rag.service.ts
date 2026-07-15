import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getDb } from "@eraser/database";
import { parseYjsSnapshot, VectorStore, getProvider } from "@eraser/ai";
import { ObjectId } from "mongodb";

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private vectorStore: VectorStore;

  constructor(private configService: ConfigService) {
    const qdrantUrl = this.configService.get<string>("QDRANT_URL") || "http://localhost:6333";
    this.vectorStore = new VectorStore(qdrantUrl);
  }

  async indexWorkspace(workspaceId: string): Promise<{ success: boolean; documentsCount: number }> {
    this.logger.log(`Indexing workspace: ${workspaceId}`);
    const db = await getDb();
    
    // Get all documents in the workspace
    const docs = await db.collection("documents").find({ workspaceId, isArchived: false }).toArray();
    
    let totalIndexed = 0;
    const providerType = this.configService.get<string>("AI_PROVIDER") || "ollama";
    const ollamaHost = this.configService.get<string>("OLLAMA_HOST") || "http://localhost:11434";
    const aiProvider = getProvider(providerType, ollamaHost);
    const embeddings = aiProvider.getEmbeddings();

    for (const doc of docs) {
      const docId = doc._id.toString();
      
      // Delete existing chunks in Qdrant for this document first
      await this.vectorStore.deleteDocumentChunks(docId);

      if (!doc.yjsSnapshot) {
        continue;
      }

      // Parse ProseMirror text and diagram shapes
      const { documentText, shapes } = parseYjsSnapshot(doc.yjsSnapshot.buffer);
      
      // 1. Index document text (chunk by paragraph/sentences)
      if (documentText && documentText.trim().length > 0) {
        const chunks = this.chunkText(documentText, 500);
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkId = new ObjectId().toHexString(); // unique Qdrant ID
          
          try {
            const vector = await embeddings.embedQuery(chunk);
            await this.vectorStore.upsertChunk({
              id: chunkId,
              workspaceId,
              documentId: docId,
              sourceType: "document",
              content: chunk,
              vector,
              metadata: {
                documentTitle: doc.title,
                chunkIndex: i,
              },
            });
          } catch (err) {
            this.logger.error(`Failed to embed document text chunk ${i} for doc ${docId}:`, err);
          }
        }
      }

      // 2. Index diagram shapes summary
      const shapesList = Object.values(shapes || {}) as any[];
      if (shapesList.length > 0) {
        const diagramSummary = this.generateDiagramSummary(doc.title, shapesList);
        const chunkId = new ObjectId().toHexString();
        try {
          const vector = await embeddings.embedQuery(diagramSummary);
          await this.vectorStore.upsertChunk({
            id: chunkId,
            workspaceId,
            documentId: docId,
            sourceType: "diagram",
            content: diagramSummary,
            vector,
            metadata: {
              documentTitle: doc.title,
            },
          });
        } catch (err) {
          this.logger.error(`Failed to embed diagram summary for doc ${docId}:`, err);
        }
      }
      
      totalIndexed++;
    }

    return {
      success: true,
      documentsCount: totalIndexed,
    };
  }

  async searchWorkspace(workspaceId: string, query: string, limit = 5): Promise<string> {
    const providerType = this.configService.get<string>("AI_PROVIDER") || "ollama";
    const ollamaHost = this.configService.get<string>("OLLAMA_HOST") || "http://localhost:11434";
    const aiProvider = getProvider(providerType, ollamaHost);
    const embeddings = aiProvider.getEmbeddings();

    try {
      const queryVector = await embeddings.embedQuery(query);
      const results = await this.vectorStore.searchSimilar({
        workspaceId,
        vector: queryVector,
        limit,
      });

      if (results.length === 0) {
        return "";
      }

      return results
        .map((r, i) => {
          const source = r.payload.sourceType === "diagram" ? "Diagram Summary" : `Document: ${r.payload.documentTitle || "Untitled"}`;
          return `[Result ${i + 1} - Source: ${source}]\n${r.payload.content}`;
        })
        .join("\n\n");
    } catch (err) {
      this.logger.error(`Search query embedding or vector retrieval failed:`, err);
      return "";
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const paragraphs = text.split(/\n+/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
      if ((currentChunk + "\n" + p).length > chunkSize) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = p;
      } else {
        currentChunk += (currentChunk ? "\n" : "") + p;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }

  private generateDiagramSummary(title: string, shapes: any[]): string {
    const entities = shapes.filter((s) => s.type === "er-entity");
    const relationships = shapes.filter((s) => s.type === "er-relationship");

    let summary = `Entity Relationship Diagram: "${title}"\n\n`;
    
    if (entities.length > 0) {
      summary += `Tables / Entities defined:\n`;
      for (const ent of entities) {
        summary += `- Table Name: ${ent.text || "Untitled"}\n`;
        const attrs = ent.attributes || [];
        if (attrs.length > 0) {
          summary += `  Attributes:\n`;
          for (const attr of attrs) {
            let details = attr.type;
            if (attr.isPk) details += " (Primary Key)";
            if (attr.isFk) details += " (Foreign Key)";
            if (!attr.isNullable) details += " (Required)";
            summary += `    * ${attr.name}: ${details}\n`;
          }
        }
      }
    }

    if (relationships.length > 0) {
      summary += `\nRelationships defined:\n`;
      for (const rel of relationships) {
        const source = entities.find((e) => e.id === rel.sourceEntityId);
        const target = entities.find((e) => e.id === rel.targetEntityId);
        if (source && target) {
          summary += `- Table "${source.text}" (${rel.sourceCardinality || "1"}) references Table "${target.text}" (${rel.targetCardinality || "*"}) [Identifying: ${rel.identifying ? "Yes" : "No"}]\n`;
        }
      }
    }

    return summary;
  }
}
