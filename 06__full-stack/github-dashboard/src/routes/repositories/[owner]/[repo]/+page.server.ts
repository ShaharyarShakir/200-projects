import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getRepositoryByPath,
	getRepositoryLanguages,
	getRepositoryContributors,
	getRepositoryBranches,
	getRepositoryCommits,
	getRepositoryReleases,
	getRepositoryTopics,
	getRepositoryReadme
} from '$lib/db/services';
import { marked } from 'marked';

/**
 * Server loader for /repositories/[owner]/[repo]
 * Validates authentication, retrieves repository data and all related lists from the database,
 * parses markdown README content, and returns data structure.
 */
export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}

	const { owner, repo: repoName } = event.params;
	const userId = event.locals.user.id;

	// Retrieve base repository
	const repository = await getRepositoryByPath(owner, repoName, userId);
	if (!repository) {
		throw error(404, {
			message: 'Repository not found in your dashboard. Try running a synchronization first.'
		});
	}

	// Retrieve child relation collections in parallel
	const [languages, contributors, branches, commits, releases, topics, readmeRecord] =
		await Promise.all([
			getRepositoryLanguages(repository.id),
			getRepositoryContributors(repository.id),
			getRepositoryBranches(repository.id),
			getRepositoryCommits(repository.id, 100, 0), // Fetch latest 100 commits
			getRepositoryReleases(repository.id),
			getRepositoryTopics(repository.id),
			getRepositoryReadme(repository.id)
		]);

	// Parse README markdown on the server for enhanced performance and SEO validation
	let readmeHtml = '';
	if (readmeRecord?.content) {
		try {
			readmeHtml = await marked.parse(readmeRecord.content);
		} catch (err) {
			console.error('Failed to parse README markdown content:', err);
			readmeHtml = `<p class="text-rose-500">Failed to render README.md file content.</p>`;
		}
	}

	return {
		repository,
		languages,
		contributors,
		branches,
		commits,
		releases,
		topics: topics.map((t) => t.topic),
		readme: readmeRecord ? { content: readmeRecord.content, html: readmeHtml } : null
	};
};
