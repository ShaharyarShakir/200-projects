import { api } from "../client.js";
import type { DocumentMetadata, Folder, DocumentSnapshot } from "@eraser/types";

// Documents API client
export const documentsApi = {
  create: async (data: {
    title: string;
    workspaceId: string;
    folderId?: string | null;
    icon?: string | null;
  }): Promise<DocumentMetadata> => {
    const res = await api.post("/documents", data);
    return res.data;
  },

  list: async (workspaceId: string, folderId?: string | null): Promise<DocumentMetadata[]> => {
    const params: any = { workspaceId };
    if (folderId !== undefined) {
      params.folderId = folderId;
    }
    const res = await api.get("/documents", { params });
    return res.data;
  },

  get: async (id: string): Promise<DocumentMetadata> => {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },

  update: async (
    id: string,
    data: {
      title?: string;
      icon?: string | null;
      cover?: string | null;
      folderId?: string | null;
      visibility?: "workspace" | "private" | "public";
    }
  ): Promise<DocumentMetadata> => {
    const res = await api.patch(`/documents/${id}`, data);
    return res.data;
  },

  archive: async (id: string): Promise<DocumentMetadata> => {
    const res = await api.patch(`/documents/${id}/archive`);
    return res.data;
  },

  restore: async (id: string): Promise<DocumentMetadata> => {
    const res = await api.patch(`/documents/${id}/restore`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  // Snapshots
  createSnapshot: async (documentId: string): Promise<Omit<DocumentSnapshot, "createdAt"> & { createdAt: string }> => {
    const res = await api.post(`/documents/${documentId}/snapshots`);
    return res.data;
  },

  listSnapshots: async (documentId: string): Promise<(Omit<DocumentSnapshot, "createdAt"> & { createdAt: string })[]> => {
    const res = await api.get(`/documents/${documentId}/snapshots`);
    return res.data;
  },

  restoreSnapshot: async (documentId: string, snapshotId: string): Promise<DocumentMetadata> => {
    const res = await api.post(`/documents/${documentId}/snapshots/${snapshotId}/restore`);
    return res.data;
  },
};

// Folders API client
export const foldersApi = {
  create: async (data: {
    name: string;
    workspaceId: string;
    parentId?: string | null;
    icon?: string | null;
    order?: number;
  }): Promise<Folder> => {
    const res = await api.post("/folders", data);
    return res.data;
  },

  list: async (workspaceId: string): Promise<Folder[]> => {
    const res = await api.get("/folders", { params: { workspaceId } });
    return res.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      parentId?: string | null;
      icon?: string | null;
      order?: number;
    }
  ): Promise<Folder> => {
    const res = await api.patch(`/folders/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/folders/${id}`);
  },
};
