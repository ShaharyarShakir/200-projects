import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@eraser/database";
import { FolderDb } from "@eraser/database";

@Injectable()
export class FolderRepository extends BaseRepository<FolderDb> {
  constructor() {
    super("folders");
  }

  async findById(id: string): Promise<FolderDb | null> {
    return this.findOne({ _id: id });
  }

  async findByWorkspace(workspaceId: string): Promise<FolderDb[]> {
    return this.find({ workspaceId });
  }

  async create(folder: FolderDb): Promise<FolderDb> {
    await this.insertOne(folder);
    return folder;
  }

  async updateFolder(id: string, update: Partial<FolderDb>): Promise<FolderDb | null> {
    await this.updateOne({ _id: id }, { $set: { ...update, updatedAt: new Date() } });
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}
