import { db } from './connection';
import { repositories } from './schema';
import { eq } from 'drizzle-orm';
import type { Repository } from '../../types';

// Infers the insert structure directly from the Drizzle schema
export type InsertRepository = typeof repositories.$inferInsert;

/**
 * Retrieves all repositories from the database.
 */
export async function getRepositories(): Promise<Repository[]> {
	const results = await db.select().from(repositories);
	// We cast the select results to Repository as the schema structure matches the interface
	return results as Repository[];
}

/**
 * Retrieves a single repository by its auto-incremented database ID.
 */
export async function getRepository(id: number): Promise<Repository | null> {
	const results = await db.select().from(repositories).where(eq(repositories.id, id)).limit(1);
	if (results.length === 0) {
		return null;
	}
	return results[0] as Repository;
}

/**
 * Creates a new repository record in the database.
 */
export async function createRepository(data: InsertRepository): Promise<Repository> {
	const results = await db.insert(repositories).values(data).returning();
	return results[0] as Repository;
}

/**
 * Updates an existing repository record in the database.
 */
export async function updateRepository(id: number, data: Partial<InsertRepository>): Promise<Repository | null> {
	const results = await db
		.update(repositories)
		.set({
			...data,
			updatedAt: new Date()
		})
		.where(eq(repositories.id, id))
		.returning();
	if (results.length === 0) {
		return null;
	}
	return results[0] as Repository;
}

/**
 * Deletes a repository record from the database.
 */
export async function deleteRepository(id: number): Promise<Repository | null> {
	const results = await db.delete(repositories).where(eq(repositories.id, id)).returning();
	if (results.length === 0) {
		return null;
	}
	return results[0] as Repository;
}
