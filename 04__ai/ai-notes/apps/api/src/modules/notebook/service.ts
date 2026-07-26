import { db, notebook, eq, and } from "@repo/database";

export class NotebookService {
  static async list(userId: string) {
    return await db.select().from(notebook).where(eq(notebook.userId, userId));
  }

  static async create(
    userId: string,
    data: { name: string; icon?: string; color?: string },
  ) {
    const [result] = await db
      .insert(notebook)
      .values({
        userId,
        name: data.name,
        icon: data.icon,
        color: data.color,
      })
      .returning();
    return result;
  }

  static async update(
    userId: string,
    id: string,
    data: { name?: string; icon?: string; color?: string },
  ) {
    const [result] = await db
      .update(notebook)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(notebook.id, id), eq(notebook.userId, userId)))
      .returning();
    return result;
  }

  static async delete(userId: string, id: string) {
    const [result] = await db
      .delete(notebook)
      .where(and(eq(notebook.id, id), eq(notebook.userId, userId)))
      .returning();
    return result;
  }
}
