import { getRepositories } from '$lib/db/repositories';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const repositories = await getRepositories();
	return {
		repositories
	};
};
