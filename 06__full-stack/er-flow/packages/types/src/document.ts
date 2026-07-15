export interface DocumentMetadata {
  id: string;
  organizationId?: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  slug: string;
  icon?: string | null;
  cover?: string | null;
  tags: string[];
  createdBy: string;
  updatedBy: string;
  visibility: "workspace" | "private" | "public";
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSnapshot {
  id: string;
  documentId: string;
  creatorId: string;
  createdAt: string;
  // Snapshot binary Yjs state can be fetched as ArrayBuffer or parsed
}
