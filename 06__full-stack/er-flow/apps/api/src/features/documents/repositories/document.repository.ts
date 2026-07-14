import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@eraser/database";
import { DocumentDb } from "@eraser/database";

@Injectable()
export class DocumentRepository extends BaseRepository<DocumentDb> {
  constructor() {
    super("documents");
  }

  async findById(id: string): Promise<DocumentDb | null> {
    return this.findOne({ _id: id });
  }

  async findBySlug(slug: string): Promise<DocumentDb | null> {
    return this.findOne({ slug });
  }

  async findByWorkspace(
    workspaceId: string,
    folderId?: string | null,
    isArchived = false
  ): Promise<DocumentDb[]> {
    const filter: any = { workspaceId, isArchived };
    if (folderId !== undefined) {
      filter.folderId = folderId;
    }
    return this.find(filter);
  }

  async create(doc: DocumentDb): Promise<DocumentDb> {
    await this.insertOne(doc);
    return doc;
  }

  async updateMetadata(id: string, metadata: Partial<DocumentDb>): Promise<DocumentDb | null> {
    await this.updateOne({ _id: id }, { $set: { ...metadata, updatedAt: new Date() } });
    return this.findById(id);
  }

  async archive(id: string): Promise<DocumentDb | null> {
    return this.updateMetadata(id, { isArchived: true });
  }

  async restore(id: string): Promise<DocumentDb | null> {
    return this.updateMetadata(id, { isArchived: false });
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}
