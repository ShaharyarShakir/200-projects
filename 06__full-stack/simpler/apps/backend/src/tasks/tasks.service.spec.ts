import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, ilike, or, SQL, sql } from 'drizzle-orm';
import { DB, type DrizzleDb } from '../database/database.module';
import { tasks } from '../database/schema/tasks';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TasksService {
  constructor(@Inject(DB) private readonly db: DrizzleDb) {}

  async create(userId: string, dto: CreateTaskDto) {
    const [task] = await this.db
      .insert(tasks)
      .values({
        userId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        status: dto.status || 'TODO',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      })
      .returning();

    return task;
  }

  async findAll(userId: string, query: QueryTaskDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      sortBy,
      sortOrder,
    } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(tasks.userId, userId)];

    if (search) {
      conditions.push(
        or(
          ilike(tasks.title, `%${search}%`),
          ilike(tasks.description, `%${search}%`),
        )!,
      );
    }

    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    const whereClause = and(...conditions);

    // Fetch paginated data
    const data = await this.db
      .select()
      .from(tasks)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(
        sortOrder === 'asc'
          ? sql`${tasks[sortBy || 'createdAt']} ASC`
          : sql`${tasks[sortBy || 'createdAt']} DESC`,
      );

    // Get total count for pagination metadata
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(tasks)
      .where(whereClause);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total: Number(total),
        totalPages,
      },
    };
  }

  async findOne(userId: string, taskId: string) {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    await this.findOne(userId, taskId);

    const [updatedTask] = await this.db
      .update(tasks)
      .set({
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return updatedTask;
  }

  async toggleComplete(userId: string, taskId: string) {
    const task = await this.findOne(userId, taskId);

    const isCompleted = task.status === 'DONE';
    const newStatus = isCompleted ? 'TODO' : 'DONE';
    const completedAt = isCompleted ? null : new Date();

    const [updatedTask] = await this.db
      .update(tasks)
      .set({
        status: newStatus,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    return updatedTask;
  }

  async remove(userId: string, taskId: string) {
    await this.findOne(userId, taskId);

    await this.db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    return { message: 'Task deleted successfully' };
  }
}
