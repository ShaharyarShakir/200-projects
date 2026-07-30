import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOctokitClient } from './client';
import { fetchGithubRepositories } from './repositories';
import { upsertRepository, deleteRemovedRepositories } from '$lib/db/repositories';
import {
	syncRepositoryLanguages,
	syncRepositoryContributors,
	syncRepositoryBranches,
	syncRepositoryCommits,
	syncRepositoryReleases,
	syncRepositoryTopics,
	syncRepositoryReadme,
	syncUserContributions
} from '$lib/db/services';

/**
 * Synchronizes GitHub repositories and user metadata for the given user.
 * Loads their access token, fetches all repositories, updates/inserts database records,
 * and fetches child relations (commits, branches, contributors, etc.) plus the user calendar.
 */
export async function syncRepositories(userId: string): Promise<number> {
	// 1. Query the accounts database table to retrieve the active GitHub access token
	const account = await db
		.select({ accessToken: accounts.accessToken })
		.from(accounts)
		.where(and(eq(accounts.userId, userId), eq(accounts.providerId, 'github')))
		.limit(1)
		.then((res) => res[0]);

	if (!account || !account.accessToken) {
		throw new Error('Unauthorized: GitHub OAuth access token not found.');
	}

	// 2. Initialize the authenticated Octokit client
	const octokit = getOctokitClient(account.accessToken);

	// 3. Fetch all user repositories recursively (handling pagination)
	const githubRepos = await fetchGithubRepositories(octokit);

	const activeGithubIds: bigint[] = [];

	// 4. Perform an upsert for each repository in the database
	for (const repo of githubRepos) {
		activeGithubIds.push(repo.githubId);

		// Save the repository base details
		const dbRepo = await upsertRepository({
			...repo,
			userId,
			syncedAt: new Date()
		});

		const repoId = dbRepo.id;
		const owner = repo.owner;
		const repoName = repo.name;

		// 5. Synchronize languages
		try {
			const languagesResponse = await octokit.rest.repos.listLanguages({
				owner,
				repo: repoName
			});
			const languagesList = Object.entries(languagesResponse.data).map(([language, bytes]) => ({
				language,
				bytes
			}));
			await syncRepositoryLanguages(repoId, languagesList);
		} catch (err) {
			console.error(`Failed to sync languages for ${owner}/${repoName}:`, err);
		}

		// 6. Synchronize branches
		try {
			const branchesResponse = await octokit.rest.repos.listBranches({
				owner,
				repo: repoName,
				per_page: 100
			});
			const branchesList = branchesResponse.data.map((b) => ({
				name: b.name,
				protected: !!b.protected,
				isDefault: b.name === (repo.defaultBranch || 'main'),
				lastCommitSha: b.commit.sha
			}));
			await syncRepositoryBranches(repoId, branchesList);
		} catch (err) {
			console.error(`Failed to sync branches for ${owner}/${repoName}:`, err);
		}

		// 7. Synchronize commits (latest 100 commits from default branch)
		try {
			const commitsResponse = await octokit.rest.repos.listCommits({
				owner,
				repo: repoName,
				sha: repo.defaultBranch || 'main',
				per_page: 100
			});
			const commitsList = commitsResponse.data.map((c) => ({
				sha: c.sha,
				author: c.commit.author?.name || c.author?.login || 'Unknown',
				avatarUrl: c.author?.avatar_url || null,
				message: c.commit.message,
				commitDate: c.commit.author?.date ? new Date(c.commit.author.date) : new Date(),
				branch: repo.defaultBranch || 'main'
			}));
			await syncRepositoryCommits(repoId, commitsList);
		} catch (err) {
			console.error(`Failed to sync commits for ${owner}/${repoName}:`, err);
		}

		// 8. Synchronize contributors
		try {
			const contributorsResponse = await octokit.rest.repos.listContributors({
				owner,
				repo: repoName,
				per_page: 100
			});
			// Standard API returns empty if repo has no commits, check array format
			if (Array.isArray(contributorsResponse.data)) {
				const contributorsList = contributorsResponse.data.map((c) => ({
					username: c.login || 'anonymous',
					avatarUrl: c.avatar_url || '',
					contributions: c.contributions || 0,
					profileLink: c.html_url || ''
				}));
				await syncRepositoryContributors(repoId, contributorsList);
			}
		} catch (err) {
			console.error(`Failed to sync contributors for ${owner}/${repoName}:`, err);
		}

		// 9. Synchronize releases
		try {
			const releasesResponse = await octokit.rest.repos.listReleases({
				owner,
				repo: repoName,
				per_page: 100
			});
			const releasesList = releasesResponse.data.map((r) => ({
				name: r.name || null,
				tagName: r.tag_name,
				publishedAt: r.published_at ? new Date(r.published_at) : null,
				isDraft: !!r.draft,
				isPrerelease: !!r.prerelease,
				body: r.body || null
			}));
			await syncRepositoryReleases(repoId, releasesList);
		} catch (err) {
			console.error(`Failed to sync releases for ${owner}/${repoName}:`, err);
		}

		// 10. Synchronize repository topics (using the list payload fields)
		try {
			// GitHub REST API list includes topics if mercy-preview was used, or by default.
			// Fallback to fetch if not present in the repositories list payload.
			const topics = (repo as any).topics || [];
			await syncRepositoryTopics(repoId, topics);
		} catch (err) {
			console.error(`Failed to sync topics for ${owner}/${repoName}:`, err);
		}

		// 11. Synchronize README content
		try {
			const readmeResponse = await octokit.rest.repos.getReadme({
				owner,
				repo: repoName,
				headers: {
					accept: 'application/vnd.github.raw'
				}
			});
			// The Accept header vnd.github.raw returns raw string directly
			if (typeof readmeResponse.data === 'string') {
				await syncRepositoryReadme(repoId, readmeResponse.data);
			}
		} catch (err: any) {
			// If README doesn't exist (404), cache a placeholder or empty content
			if (err.status === 404) {
				await syncRepositoryReadme(
					repoId,
					'# No README.md\nThis repository does not have a README.md file.'
				);
			} else {
				console.error(`Failed to sync README for ${owner}/${repoName}:`, err);
			}
		}
	}

	// 12. Delete any local database repository records that were removed from GitHub
	await deleteRemovedRepositories(userId, activeGithubIds);

	// 13. Synchronize GitHub User Contribution Calendar using GitHub GraphQL API
	try {
		const viewer = await octokit.rest.users.getAuthenticated();
		const username = viewer.data.login;

		const oneYearAgo = new Date();
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

		const query = `
			query($username: String!, $from: DateTime!, $to: DateTime!) {
				user(login: $username) {
					contributionsCollection(from: $from, to: $to) {
						contributionCalendar {
							totalContributions
							weeks {
								contributionDays {
									contributionCount
									date
								}
							}
						}
					}
				}
			}
		`;

		const calendarData = await octokit.graphql<{
			user: {
				contributionsCollection: {
					contributionCalendar: {
						totalContributions: number;
						weeks: {
							contributionDays: {
								contributionCount: number;
								date: string;
							}[];
						}[];
					};
				};
			};
		}>(query, {
			username,
			from: oneYearAgo.toISOString(),
			to: new Date().toISOString()
		});

		if (calendarData?.user?.contributionsCollection?.contributionCalendar?.weeks) {
			const weeks = calendarData.user.contributionsCollection.contributionCalendar.weeks;
			const contributionsList: { date: Date; count: number }[] = [];

			for (const week of weeks) {
				for (const day of week.contributionDays) {
					contributionsList.push({
						date: new Date(day.date),
						count: day.contributionCount
					});
				}
			}
			await syncUserContributions(userId, contributionsList);
		}
	} catch (err) {
		console.error('Failed to sync user contribution calendar:', err);
	}

	return githubRepos.length;
}
