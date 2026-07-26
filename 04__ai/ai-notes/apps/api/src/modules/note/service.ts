import { db, note, eq, and, isNull, isNotNull, ilike, or } from "@repo/database";

export class NoteService {
  static async list(userId: string) {
    // List all non-deleted, non-archived notes for the user
    return await db
      .select()
      .from(note)
      .where(and(eq(note.userId, userId), isNull(note.deletedAt)));
  }

  static async get(userId: string, id: string) {
    const [result] = await db
      .select()
      .from(note)
      .where(and(eq(note.id, id), eq(note.userId, userId)));
    return result || null;
  }

  static async create(
    userId: string,
    data: { title: string; notebookId?: string | null; content?: any },
  ) {
    const [result] = await db
      .insert(note)
      .values({
        userId,
        title: data.title,
        notebookId: data.notebookId || null,
        content: data.content || { type: "doc", content: [] },
      })
      .returning();
    return result;
  }

  static async update(
    userId: string,
    id: string,
    data: {
      title?: string;
      notebookId?: string | null;
      content?: any;
      isFavorite?: boolean;
      isPinned?: boolean;
      isArchived?: boolean;
    },
  ) {
    const [result] = await db
      .update(note)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(note.id, id), eq(note.userId, userId)))
      .returning();
    return result;
  }

  static async softDelete(userId: string, id: string) {
    const [result] = await db
      .update(note)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(note.id, id), eq(note.userId, userId)))
      .returning();
    return result;
  }

  static async restore(userId: string, id: string) {
    const [result] = await db
      .update(note)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(note.id, id), eq(note.userId, userId)))
      .returning();
    return result;
  }

  static async permanentDelete(userId: string, id: string) {
    const [result] = await db
      .delete(note)
      .where(and(eq(note.id, id), eq(note.userId, userId)))
      .returning();
    return result;
  }

  static async search(userId: string, query: string) {
    return await db
      .select()
      .from(note)
      .where(
        and(
          eq(note.userId, userId),
          isNull(note.deletedAt),
          ilike(note.title, `%${query}%`),
        ),
      );
  }

  static async listTrash(userId: string) {
    // List all soft-deleted notes
    return await db
      .select()
      .from(note)
      .where(and(eq(note.userId, userId), isNotNull(note.deletedAt)));
  }
}
