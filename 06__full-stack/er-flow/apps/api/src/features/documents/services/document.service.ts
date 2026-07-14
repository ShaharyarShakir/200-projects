import { Injectable, NotFoundException } from "@nestjs/common";
import { DocumentRepository } from "../repositories/document.repository.js";
import { DocumentDb, getDb } from "@eraser/database";
import { Binary, ObjectId } from "mongodb";

@Injectable()
export class DocumentService {
  constructor(private readonly documentRepo: DocumentRepository) {}

  private mapDoc(doc: DocumentDb | null): any {
    if (!doc) return null;
    return {
      ...doc,
      id: doc._id,
    };
  }

  async create(
    title: string,
    workspaceId: string,
    folderId: string | null | undefined,
    icon: string | null | undefined,
    createdBy: string
  ): Promise<any> {
    const id = new ObjectId().toHexString();
    const cleanTitle = title.trim();
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Math.random().toString(36).substring(2, 7);

    const newDoc: DocumentDb = {
      _id: id,
      workspaceId,
      folderId: folderId || null,
      title: cleanTitle,
      slug,
      icon: icon || null,
      tags: [],
      createdBy,
      updatedBy: createdBy,
      visibility: "workspace",
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await this.documentRepo.create(newDoc);
    return this.mapDoc(created);
  }

  async list(workspaceId: string, folderId?: string | null): Promise<any[]> {
    const docs = await this.documentRepo.findByWorkspace(workspaceId, folderId);
    return docs.map(d => this.mapDoc(d));
  }

  async findOne(id: string): Promise<any> {
    const doc = await this.documentRepo.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return this.mapDoc(doc);
  }

  async update(id: string, updateData: Partial<DocumentDb>, userId: string): Promise<any> {
    // Make sure it exists
    await this.findOne(id);
    const updated = await this.documentRepo.updateMetadata(id, {
      ...updateData,
      updatedBy: userId,
    });
    if (!updated) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return this.mapDoc(updated);
  }

  async archive(id: string, userId: string): Promise<any> {
    await this.findOne(id);
    const doc = await this.documentRepo.archive(id);
    if (!doc) throw new NotFoundException();
    return this.mapDoc(doc);
  }

  async restore(id: string, userId: string): Promise<any> {
    await this.findOne(id);
    const doc = await this.documentRepo.restore(id);
    if (!doc) throw new NotFoundException();
    return this.mapDoc(doc);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.documentRepo.delete(id);
    
    // Clean up snapshots and Yjs snapshot state in database
    const db = await getDb();
    await db.collection("document_snapshots").deleteMany({ documentId: id });
  }

  // Snapshots
  async createSnapshot(documentId: string, creatorId: string): Promise<any> {
    const doc = await this.findOne(documentId);
    
    const db = await getDb();
    // Retrieve Yjs collaborative state stored in main documents collection
    const mainDoc = await db.collection("documents").findOne({ _id: documentId as any });
    if (!mainDoc || !mainDoc.yjsSnapshot) {
      throw new NotFoundException(`No Yjs snapshot found for document ${documentId} to snapshot.`);
    }

    const snapshotId = new ObjectId().toHexString();
    const snapshot = {
      _id: snapshotId,
      documentId,
      creatorId,
      createdAt: new Date(),
      yjsSnapshot: mainDoc.yjsSnapshot,
    };

    await db.collection("document_snapshots").insertOne(snapshot as any);
    return {
      id: snapshotId,
      documentId,
      creatorId,
      createdAt: snapshot.createdAt,
    };
  }

  async listSnapshots(documentId: string): Promise<any[]> {
    await this.findOne(documentId);
    const db = await getDb();
    const list = await db.collection("document_snapshots")
      .find({ documentId })
      .project({ yjsSnapshot: 0 }) // Omit binary from index listing
      .toArray();

    return list.map(s => ({
      id: s._id,
      documentId: s.documentId,
      creatorId: s.creatorId,
      createdAt: s.createdAt,
    }));
  }

  async restoreSnapshot(documentId: string, snapshotId: string, userId: string): Promise<DocumentDb> {
    await this.findOne(documentId);
    
    const db = await getDb();
    const snapshot = await db.collection("document_snapshots").findOne({ _id: snapshotId as any });
    if (!snapshot) {
      throw new NotFoundException(`Snapshot ${snapshotId} not found`);
    }

    // Set document collaborative snapshot
    await db.collection("documents").updateOne(
      { _id: documentId as any },
      {
        $set: {
          yjsSnapshot: snapshot.yjsSnapshot,
          updatedAt: new Date(),
          updatedBy: userId,
        }
      }
    );

    return this.findOne(documentId);
  }
}
