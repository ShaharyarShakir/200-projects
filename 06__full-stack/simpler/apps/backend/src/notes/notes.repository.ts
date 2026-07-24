import { Injectable, Inject } from '@nestjs/common';
import { eq, and, ilike, or, sql, desc, inArray } from 'drizzle-orm';
import { DB, type DrizzleDb } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';

type Tx = Parameters<Parameters<DrizzleDb['transaction']>[0]>[0];

@Injectable()
export class NotesRepository {
  constructor(@Inject(DB) private db: DrizzleDb) {}

  async create(userId: string, dto: CreateNoteDto) {
    return await this.db.transaction(async (tx) => {
      const note = await tx
        .insert(schema.notes)
        .values({
          userId,
          title: dto.title,
          content: dto.content || '',
          taskId: dto.taskId || null,
        })
        .returning()
        .then((rows) => rows[0]);

      if (!note) throw new Error('Failed to create note');

      if (dto.tags && dto.tags.length > 0) {
        await this.syncTags(tx, note.id, dto.tags);
      }

      return this.findOne(userId, note.id);
    });
  }

  async findAll(userId: string, query: QueryNoteDto) {
    const { search, favorite, tag, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(schema.notes.userId, userId)];

    if (favorite !== undefined) {
      conditions.push(eq(schema.notes.favorite, favorite));
    }

    if (search) {
      conditions.push(
        or(
          ilike(schema.notes.title, `%${search}%`),
          ilike(schema.notes.content, `%${search}%`),
        )!,
      );
    }

    if (tag) {
      const taggedNoteIds = this.db
        .select({ noteId: schema.noteTags.noteId })
        .from(schema.noteTags)
        .innerJoin(schema.tags, eq(schema.noteTags.tagId, schema.tags.id))
        .where(eq(schema.tags.name, tag));

      conditions.push(inArray(schema.notes.id, taggedNoteIds));
    }

    const whereClause = and(...conditions);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.notes)
      .where(whereClause)
      .then((rows) => rows[0] ?? { count: 0 });

    const data = await this.db.query.notes.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(schema.notes.updatedAt)],
      with: {
        noteTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    const formattedData = data.map((note) => ({
      ...note,
      tags: note.noteTags.map((nt) => nt.tag),
    }));

    return {
      data: formattedData,
      meta: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const note = await this.db.query.notes.findFirst({
      where: and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)),
      with: {
        noteTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!note) return null;

    return {
      ...note,
      tags: note.noteTags.map((nt) => nt.tag),
    };
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    return await this.db.transaction(async (tx) => {
      const [updatedNote] = await tx
        .update(schema.notes)
        .set({
          ...(dto.title && { title: dto.title }),
          ...(dto.content !== undefined && { content: dto.content }),
          ...(dto.favorite !== undefined && { favorite: dto.favorite }),
          ...(dto.taskId !== undefined && { taskId: dto.taskId }),
          updatedAt: new Date(),
        })
        .where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)))
        .returning();

      if (!updatedNote) return null;

      if (dto.tags) {
        await tx.delete(schema.noteTags).where(eq(schema.noteTags.noteId, id));
        await this.syncTags(tx, id, dto.tags);
      }

      return this.findOne(userId, id);
    });
  }

  async delete(userId: string, id: string) {
    const [deletedNote] = await this.db
      .delete(schema.notes)
      .where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)))
      .returning();
    return !!deletedNote;
  }

  async convertToTask(userId: string, noteId: string) {
    return await this.db.transaction(async (tx) => {
      const note = await this.findOne(userId, noteId);
      if (!note) throw new Error('Note not found');

      const task = await tx
        .insert(schema.tasks)
        .values({
          userId,
          title: note.title,
          description: note.content,
          status: 'TODO',
        })
        .returning()
        .then((rows) => rows[0]);

      if (!task) throw new Error('Failed to create task');

      await tx
        .update(schema.notes)
        .set({ taskId: task.id })
        .where(eq(schema.notes.id, noteId));

      return task;
    });
  }

  private async syncTags(tx: Tx, noteId: string, tagNames: string[]) {
    for (const name of tagNames) {
      const existing = await tx
        .select()
        .from(schema.tags)
        .where(eq(schema.tags.name, name));
      const inserted = await tx
        .insert(schema.tags)
        .values({ name })
        .returning();
      if (!inserted[0]) throw new Error('Failed to create tag');
      const tagId = existing[0] ? existing[0].id : inserted[0].id;
      await tx
        .insert(schema.noteTags)
        .values({ noteId, tagId })
        .onConflictDoNothing();
    }
  }
}
