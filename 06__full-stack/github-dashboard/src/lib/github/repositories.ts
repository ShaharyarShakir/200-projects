import type { Octokit } from '@octokit/rest';

export interface GitHubRepositoryData {
	githubId: bigint;
	owner: string;
	ownerAvatar: string;
	name: string;
	fullName: string;
	private: boolean;
	visibility: string;
	defaultBranch: string;
	description: string | null;
	language: string | null;
	license: string | null;
	homepage: string | null;
	stars: number;
	watchers: number;
	forks: number;
	openIssues: number;
	size: number;
	archived: boolean;
	disabled: boolean;
	hasIssues: boolean;
	hasProjects: boolean;
	hasWiki: boolean;
	createdAt: Date;
	updatedAt: Date;
	pushedAt: Date;
}

/**
 * Fetches all repositories of the authenticated user from GitHub.
 * Queries pages recursively (100 per page) until all repositories are collected.
 */
export async function fetchGithubRepositories(octokit: Octokit): Promise<GitHubRepositoryData[]> {
	let page = 1;
	const perPage = 100;
	const allRepos: any[] = [];

	while (true) {
		// Fetch one page of repositories for the authenticated user
		const response = await octokit.rest.repos.listForAuthenticatedUser({
			per_page: perPage,
			page,
			sort: 'updated'
		});

		if (response.data.length === 0) {
			break;
		}

		allRepos.push(...response.data);

		// If fewer repositories are returned than the per_page limit, we have reached the end
		if (response.data.length < perPage) {
			break;
		}

		page++;
	}

	// Map raw GitHub API response to our database schema layout
	return allRepos.map((repo) => ({
		githubId: BigInt(repo.id),
		owner: repo.owner.login,
		ownerAvatar: repo.owner.avatar_url,
		name: repo.name,
		fullName: repo.full_name,
		private: repo.private,
		visibility: repo.visibility || (repo.private ? 'private' : 'public'),
		defaultBranch: repo.default_branch || 'main',
		description: repo.description || null,
		language: repo.language || null,
		license: repo.license?.name || repo.license?.spdx_id || null,
		homepage: repo.homepage || null,
		stars: repo.stargazers_count || 0,
		watchers: repo.watchers_count || 0,
		forks: repo.forks_count || 0,
		openIssues: repo.open_issues_count || 0,
		size: repo.size || 0,
		archived: !!repo.archived,
		disabled: !!repo.disabled,
		hasIssues: repo.has_issues !== false,
		hasProjects: repo.has_projects !== false,
		hasWiki: repo.has_wiki !== false,
		createdAt: repo.created_at ? new Date(repo.created_at) : new Date(),
		updatedAt: repo.updated_at ? new Date(repo.updated_at) : new Date(),
		pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : new Date()
	}));
}
