export interface Folder {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  name: string;
  icon?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}
