import { db } from './connection';
import { repositories } from './schema';

const sampleRepositories = [
	{
		githubId: 100000001n,
		name: 'SvelteKit Dashboard',
		fullName: 'svelte-admin/SvelteKit-Dashboard',
		owner: 'svelte-admin',
		language: 'TypeScript',
		stars: 342,
		forks: 45,
		openIssues: 12,
		description: 'A beautiful and modern dashboard for SvelteKit projects.',
		updatedAt: new Date()
	},
	{
		githubId: 100000002n,
		name: 'GitHub Dashboard',
		fullName: 'git-dash-dev/GitHub-Dashboard',
		owner: 'git-dash-dev',
		language: 'Svelte',
		stars: 1205,
		forks: 189,
		openIssues: 4,
		description: 'Complete repository metrics and analytics dashboard.',
		updatedAt: new Date()
	},
	{
		githubId: 100000003n,
		name: 'Portfolio',
		fullName: 'portfolio-creator/Portfolio',
		owner: 'portfolio-creator',
		language: 'Rust',
		stars: 89,
		forks: 12,
		openIssues: 0,
		description: 'My personal web developer portfolio page, showcase projects and experience.',
		updatedAt: new Date()
	},
	{
		githubId: 100000004n,
		name: 'AI Notes',
		fullName: 'ai-notes-corp/AI-Notes',
		owner: 'ai-notes-corp',
		language: 'Python',
		stars: 450,
		forks: 92,
		openIssues: 34,
		description:
			'AI-powered note taking and organization application with LLM search capabilities.',
		updatedAt: new Date()
	},
	{
		githubId: 100000005n,
		name: 'Expense Tracker',
		fullName: 'tracker-master/Expense-Tracker',
		owner: 'tracker-master',
		language: 'Go',
		stars: 182,
		forks: 23,
		openIssues: 8,
		description: 'Track your daily expenses and plan your budget easily.',
		updatedAt: new Date()
	}
];

async function main() {
	console.log('Seeding database with mock repositories...');

	try {
		// Clear existing repositories first
		await db.delete(repositories);

		// Insert samples
		await db.insert(repositories).values(sampleRepositories);

		console.log('Database seeded successfully!');
		process.exit(0);
	} catch (error) {
		console.error('Error seeding database:', error);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
