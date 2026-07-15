import { QdrantClient } from "@qdrant/js-client-rest";

export class VectorStore {
  private client: QdrantClient;
  private collectionName = "workspace_knowledge";

  constructor(url = "http://localhost:6333") {
    this.client = new QdrantClient({ url });
  }

  async initCollection() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 768, // nomic-embed-text size
            distance: "Cosine",
          },
        });
        console.log(`Created Qdrant collection: ${this.collectionName}`);
      }
    } catch (err) {
      console.error("Failed to initialize Qdrant collection:", err);
    }
  }

  async upsertChunk(params: {
    id: string;
    workspaceId: string;
    documentId?: string;
    sourceType: "document" | "diagram" | "comment" | "schema";
    content: string;
    vector: number[];
    metadata?: Record<string, any>;
  }) {
    await this.initCollection();
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: [
        {
          id: params.id,
          vector: params.vector,
          payload: {
            workspaceId: params.workspaceId,
            documentId: params.documentId,
            sourceType: params.sourceType,
            content: params.content,
            ...(params.metadata || {}),
          },
        },
      ],
    });
  }

  async deleteDocumentChunks(documentId: string) {
    await this.initCollection();
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: "documentId",
              match: {
                value: documentId,
              },
            },
          ],
        },
      });
    } catch (err) {
      console.error(`Failed to delete chunks for document ${documentId}:`, err);
    }
  }

  async searchSimilar(params: {
    workspaceId: string;
    vector: number[];
    limit?: number;
  }) {
    await this.initCollection();
    const results = await this.client.search(this.collectionName, {
      vector: params.vector,
      limit: params.limit || 5,
      filter: {
        must: [
          {
            key: "workspaceId",
            match: {
              value: params.workspaceId,
            },
          },
        ],
      },
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as {
        workspaceId: string;
        documentId?: string;
        sourceType: string;
        content: string;
        [key: string]: any;
      },
    }));
  }
}
