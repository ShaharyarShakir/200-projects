import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import SkillCard from "#/components/SkillCard";
import { getSkills } from "#/dataconnect-generated";
import { dataConnect } from "#/lib/firebase";

interface SkillsSearch {
	q?: string;
}

const searchSkillsFn = createServerFn({ method: "GET" })
	.validator((search: { q?: string }) => search)
	.handler(async ({ data: { q = "" } }) => {
		try {
			const { data } = await getSkills(dataConnect, {
				searchTerm: q,
				limit: 20,
			});
			return data.skills;
		} catch (error) {
			console.error("Error fetching searched skills:", error);
			return [];
		}
	});

export const Route = createFileRoute("/skills/")({
	validateSearch: (search: Record<string, unknown>): SkillsSearch => {
		return {
			q: (search.q as string) || undefined,
		};
	},
	loaderDeps: ({ search: { q } }) => ({ q }),
	loader: ({ deps: { q } }) => searchSkillsFn({ data: { q } }),
	component: RegistryExplorer,
});

function RegistryExplorer() {
	const { q } = Route.useSearch();
	const skills = Route.useLoaderData() ?? [];
	const navigate = useNavigate({ from: Route.fullPath });

	const [searchQuery, setSearchQuery] = useState(q || "");

	// Keep local input field in sync with URL queries (e.g. back/forward navigation)
	useEffect(() => {
		setSearchQuery(q || "");
	}, [q]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		navigate({
			search: (prev) => ({
				...prev,
				q: searchQuery.trim() ? searchQuery.trim() : undefined,
			}),
		});
	};

	const handleClear = () => {
		setSearchQuery("");
		navigate({
			search: (prev) => ({
				...prev,
				q: undefined,
			}),
		});
	};

	return (
		<div id="skills-page">
			<section className="intro">
				<header>
					<h1>Registry Explorer</h1>
					<p>
						Search and discover reusable capability packages for your agentic
						workflow.
					</p>
				</header>

				<Link to="/skills/new" className="btn-primary">
					<Plus size={16} />
					<span>Publish Skill</span>
				</Link>

				<form onSubmit={handleSearchSubmit} className="search-bar">
					<div className="row">
						<div className="field">
							<Search className="icon" size={18} />
							<input
								type="text"
								className="input-field search-input"
								placeholder="Search skills by title or description..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={handleClear}
									className="search-clear cursor-pointer text-text-muted hover:text-black dark:hover:text-white"
									style={{ border: "none", background: "none" }}
								>
									<X size={16} />
								</button>
							)}
						</div>
						<button type="submit" className="btn-primary search-filters">
							<span>Search</span>
						</button>
					</div>
					{q && (
						<p className="status">
							Showing results for "<span>{q}</span>"
						</p>
					)}
				</form>
			</section>

			<section className="results">
				{skills.length > 0 ? (
					<div className="skills-grid">
						{skills.map((skill) => (
							<SkillCard key={skill.id} {...skill} />
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<p className="text-text-muted text-base mb-4">
							{q
								? `No skills found matching "${q}"`
								: "No skills have been published yet."}
						</p>
						{q && (
							<button onClick={handleClear} className="btn-secondary mx-auto">
								Clear Search
							</button>
						)}
					</div>
				)}
			</section>
		</div>
	);
}
