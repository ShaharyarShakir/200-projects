export interface Repository {
	id: number;
	githubId: bigint | null;
	name: string;
	owner: string | null;
	language: string | null;
	stars: number | null;
	forks: number | null;
	openIssues: number | null;
	description: string | null;
	updatedAt: Date | null;
	createdAt: Date;
}
