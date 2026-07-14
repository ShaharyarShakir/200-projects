import { Injectable, NotFoundException } from "@nestjs/common";
import { FolderRepository } from "../repositories/folder.repository.js";
import { FolderDb, getDb } from "@eraser/database";
import { ObjectId } from "mongodb";

@Injectable()
export class FolderService {
  constructor(private readonly folderRepo: FolderRepository) {}

  private mapFolder(folder: FolderDb | null): any {
    if (!folder) return null;
    return {
      ...folder,
      id: folder._id,
    };
  }

  async create(
    name: string,
    workspaceId: string,
    parentId: string | null | undefined,
    icon: string | null | undefined,
    order?: number
  ): Promise<any> {
    const id = new ObjectId().toHexString();
    const newFolder: FolderDb = {
      _id: id,
      workspaceId,
      parentId: parentId || null,
      name: name.trim(),
      icon: icon || null,
      order: order !== undefined ? order : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const created = await this.folderRepo.create(newFolder);
    return this.mapFolder(created);
  }

  async list(workspaceId: string): Promise<any[]> {
    const list = await this.folderRepo.findByWorkspace(workspaceId);
    return list.map(f => this.mapFolder(f));
  }

  async findOne(id: string): Promise<any> {
    const folder = await this.folderRepo.findById(id);
    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found`);
    }
    return this.mapFolder(folder);
  }

  async update(id: string, updateData: Partial<FolderDb>): Promise<any> {
    await this.findOne(id);
    const updated = await this.folderRepo.updateFolder(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Folder ${id} not found`);
    }
    return this.mapFolder(updated);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.folderRepo.delete(id);
    
    // Clean up or dissociate sub-folders and documents inside this folder
    const db = await getDb();
    await db.collection("folders").updateMany({ parentId: id }, { $set: { parentId: null } });
    await db.collection("documents").updateMany({ folderId: id }, { $set: { folderId: null } });
  }
}
