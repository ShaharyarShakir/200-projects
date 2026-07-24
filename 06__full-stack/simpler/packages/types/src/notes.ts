export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  userId: string;
  taskId: string | null;
  title: string;
  content: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface CreateNoteDto {
  title: string;
  content?: string;
  taskId?: string;
  tags?: string[]; // Array of Tag IDs or Names
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  taskId?: string | null;
  favorite?: boolean;
  tags?: string[];
}

export interface QueryNoteDto {
  search?: string;
  favorite?: boolean;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedNotes {
  data: Note[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
