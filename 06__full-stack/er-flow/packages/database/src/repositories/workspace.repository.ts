import { BaseRepository } from "./base.repository.js";
import { WorkspaceDb, WorkspaceDbSchema, COLLECTIONS } from "../collections.js";

export class WorkspaceRepository extends BaseRepository<WorkspaceDb> {
  constructor() {
    super(COLLECTIONS.WORKSPACES);
  }

  async findById(id: string): Promise<WorkspaceDb | null> {
    const col = await this.getCollection();
    const doc = await col.findOne({ _id: id } as any);
    if (!doc) return null;
    return WorkspaceDbSchema.parse(doc);
  }

  async findBySlug(slug: string): Promise<WorkspaceDb | null> {
    const col = await this.getCollection();
    const doc = await col.findOne({ slug } as any);
    if (!doc) return null;
    return WorkspaceDbSchema.parse(doc);
  }

  async createWorkspace(workspace: Omit<WorkspaceDb, "createdAt" | "updatedAt">): Promise<WorkspaceDb> {
    const col = await this.getCollection();
    const now = new Date();
    const newDoc: WorkspaceDb = {
      ...workspace,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(newDoc as any);
    return newDoc;
  }
}
