import { db } from '$lib/server/db';
import {
	repositories,
	repositoryLanguages,
	repositoryContributors,
	repositoryBranches,
	repositoryCommits,
	repositoryReleases,
	repositoryTopics,
	repositoryReadmeCache,
	userContributions
} from './schema';
import { eq, and, desc, asc } from 'drizzle-orm';

// ----------------------------------------------------
// Repositories Detail Helpers
// ----------------------------------------------------

export async function getRepositoryByPath(owner: string, name: string, userId: string) {
	const result = await db
		.select()
		.from(repositories)
		.where(
			and(
				eq(repositories.owner, owner),
				eq(repositories.name, name),
				eq(repositories.userId, userId)
			)
		)
		.limit(1);
	return result[0] || null;
}

// ----------------------------------------------------
// Languages Services
// ----------------------------------------------------

export async function syncRepositoryLanguages(
	repositoryId: number,
	languagesList: { language: string; bytes: number }[]
) {
	// Delete existing languages for the repository
	await db.delete(repositoryLanguages).where(eq(repositoryLanguages.repositoryId, repositoryId));

	if (languagesList.length > 0) {
		await db.insert(repositoryLanguages).values(
			languagesList.map((lang) => ({
				repositoryId,
				language: lang.language,
				bytes: lang.bytes
			}))
		);
	}
}

export async function getRepositoryLanguages(repositoryId: number) {
	return db
		.select()
		.from(repositoryLanguages)
		.where(eq(repositoryLanguages.repositoryId, repositoryId))
		.orderBy(desc(repositoryLanguages.bytes));
}

// ----------------------------------------------------
// Contributors Services
// ----------------------------------------------------

export async function syncRepositoryContributors(
	repositoryId: number,
	contributorsList: {
		username: string;
		avatarUrl: string;
		contributions: number;
		profileLink: string;
	}[]
) {
	await db
		.delete(repositoryContributors)
		.where(eq(repositoryContributors.repositoryId, repositoryId));

	if (contributorsList.length > 0) {
		await db.insert(repositoryContributors).values(
			contributorsList.map((contrib) => ({
				repositoryId,
				username: contrib.username,
				avatarUrl: contrib.avatarUrl,
				contributions: contrib.contributions,
				profileLink: contrib.profileLink
			}))
		);
	}
}

export async function getRepositoryContributors(repositoryId: number) {
	return db
		.select()
		.from(repositoryContributors)
		.where(eq(repositoryContributors.repositoryId, repositoryId))
		.orderBy(desc(repositoryContributors.contributions));
}

// ----------------------------------------------------
// Branches Services
// ----------------------------------------------------

export async function syncRepositoryBranches(
	repositoryId: number,
	branchesList: { name: string; protected: boolean; isDefault: boolean; lastCommitSha: string }[]
) {
	await db.delete(repositoryBranches).where(eq(repositoryBranches.repositoryId, repositoryId));

	if (branchesList.length > 0) {
		await db.insert(repositoryBranches).values(
			branchesList.map((branch) => ({
				repositoryId,
				name: branch.name,
				protected: branch.protected,
				isDefault: branch.isDefault,
				lastCommitSha: branch.lastCommitSha
			}))
		);
	}
}

export async function getRepositoryBranches(repositoryId: number) {
	return db
		.select()
		.from(repositoryBranches)
		.where(eq(repositoryBranches.repositoryId, repositoryId))
		.orderBy(desc(repositoryBranches.isDefault), asc(repositoryBranches.name));
}

// ----------------------------------------------------
// Commits Services
// ----------------------------------------------------

export async function syncRepositoryCommits(
	repositoryId: number,
	commitsList: {
		sha: string;
		author: string;
		avatarUrl: string | null;
		message: string;
		commitDate: Date;
		branch: string;
	}[]
) {
	await db.delete(repositoryCommits).where(eq(repositoryCommits.repositoryId, repositoryId));

	if (commitsList.length > 0) {
		await db.insert(repositoryCommits).values(
			commitsList.map((commit) => ({
				repositoryId,
				sha: commit.sha,
				author: commit.author,
				avatarUrl: commit.avatarUrl,
				message: commit.message,
				commitDate: commit.commitDate,
				branch: commit.branch
			}))
		);
	}
}

export async function getRepositoryCommits(repositoryId: number, limit = 100, offset = 0) {
	return db
		.select()
		.from(repositoryCommits)
		.where(eq(repositoryCommits.repositoryId, repositoryId))
		.orderBy(desc(repositoryCommits.commitDate))
		.limit(limit)
		.offset(offset);
}

// ----------------------------------------------------
// Releases Services
// ----------------------------------------------------

export async function syncRepositoryReleases(
	repositoryId: number,
	releasesList: {
		name: string | null;
		tagName: string;
		publishedAt: Date | null;
		isDraft: boolean;
		isPrerelease: boolean;
		body: string | null;
	}[]
) {
	await db.delete(repositoryReleases).where(eq(repositoryReleases.repositoryId, repositoryId));

	if (releasesList.length > 0) {
		await db.insert(repositoryReleases).values(
			releasesList.map((release) => ({
				repositoryId,
				name: release.name,
				tagName: release.tagName,
				publishedAt: release.publishedAt,
				isDraft: release.isDraft,
				isPrerelease: release.isPrerelease,
				body: release.body
			}))
		);
	}
}

export async function getRepositoryReleases(repositoryId: number) {
	return db
		.select()
		.from(repositoryReleases)
		.where(eq(repositoryReleases.repositoryId, repositoryId))
		.orderBy(desc(repositoryReleases.publishedAt));
}

// ----------------------------------------------------
// Topics Services
// ----------------------------------------------------

export async function syncRepositoryTopics(repositoryId: number, topicsList: string[]) {
	await db.delete(repositoryTopics).where(eq(repositoryTopics.repositoryId, repositoryId));

	if (topicsList.length > 0) {
		await db.insert(repositoryTopics).values(
			topicsList.map((topic) => ({
				repositoryId,
				topic
			}))
		);
	}
}

export async function getRepositoryTopics(repositoryId: number) {
	return db.select().from(repositoryTopics).where(eq(repositoryTopics.repositoryId, repositoryId));
}

// ----------------------------------------------------
// README Services
// ----------------------------------------------------

export async function syncRepositoryReadme(repositoryId: number, content: string) {
	await db.insert(repositoryReadmeCache).values({ repositoryId, content }).onConflictDoUpdate({
		target: repositoryReadmeCache.repositoryId,
		set: { content }
	});
}

export async function getRepositoryReadme(repositoryId: number) {
	const result = await db
		.select()
		.from(repositoryReadmeCache)
		.where(eq(repositoryReadmeCache.repositoryId, repositoryId))
		.limit(1);
	return result[0] || null;
}

// ----------------------------------------------------
// User Contributions Calendar & Streaks Services
// ----------------------------------------------------

export async function syncUserContributions(
	userId: string,
	contributionsList: { date: Date; count: number }[]
) {
	// Sync user contributions (upsert on conflict date + user)
	// First let's clear existing contribution calendar for user to avoid bloating or conflicts
	await db.delete(userContributions).where(eq(userContributions.userId, userId));

	if (contributionsList.length > 0) {
		// Split into chunks of 100 to avoid SQL statement parameter limits
		const chunkSize = 100;
		for (let i = 0; i < contributionsList.length; i += chunkSize) {
			const chunk = contributionsList.slice(i, i + chunkSize);
			await db.insert(userContributions).values(
				chunk.map((c) => ({
					userId,
					date: c.date.toISOString().split('T')[0],
					count: c.count
				}))
			);
		}
	}
}

export async function getUserContributions(userId: string) {
	return db
		.select()
		.from(userContributions)
		.where(eq(userContributions.userId, userId))
		.orderBy(asc(userContributions.date));
}

export interface StreakStats {
	totalContributions: number;
	contributionDays: number;
	currentStreak: number;
	longestStreak: number;
	contributions: { date: string; count: number }[];
}

export async function getStreakStats(userId: string): Promise<StreakStats> {
	const contributions = await db
		.select()
		.from(userContributions)
		.where(eq(userContributions.userId, userId))
		.orderBy(asc(userContributions.date));

	let longestStreak = 0;
	let currentStreak = 0;
	let totalContributions = 0;
	let contributionDays = 0;

	// Use user's local timezone dates for comparison, formatted as YYYY-MM-DD
	const dates = contributions.map((c) => ({
		date: c.date, // YYYY-MM-DD string
		count: c.count
	}));

	let tempStreak = 0;
	let lastDateStr: string | null = null;

	for (const day of dates) {
		totalContributions += day.count;
		if (day.count > 0) {
			contributionDays++;

			if (lastDateStr) {
				const prevDate = new Date(lastDateStr);
				const currDate = new Date(day.date);
				const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

				if (diffDays <= 1) {
					tempStreak++;
				} else {
					tempStreak = 1;
				}
			} else {
				tempStreak = 1;
			}
			lastDateStr = day.date;

			if (tempStreak > longestStreak) {
				longestStreak = tempStreak;
			}
		}
	}

	// Calculate Current Streak
	// Current streak is active if the user has contribution today or yesterday
	if (lastDateStr) {
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split('T')[0];

		if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
			currentStreak = tempStreak;
		} else {
			currentStreak = 0;
		}
	}

	return {
		totalContributions,
		contributionDays,
		currentStreak,
		longestStreak,
		contributions: dates
	};
}
