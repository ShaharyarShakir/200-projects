import { Octokit } from '@octokit/rest';

/**
 * Creates and returns an authenticated instance of the Octokit client
 * using the provided GitHub OAuth access token.
 */
export function getOctokitClient(accessToken: string): Octokit {
	return new Octokit({
		auth: accessToken
	});
}
