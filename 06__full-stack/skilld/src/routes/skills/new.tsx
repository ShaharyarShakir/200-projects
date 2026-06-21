import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import { ArrowLeft, Sparkles, Terminal, Code, Settings } from "lucide-react";
import { insertSkill } from "#/dataconnect-generated";
import { dataConnect } from "#/lib/firebase";

export const Route = createFileRoute("/skills/new")({
	component: PublishSkill,
});

function PublishSkill() {
	const { user, isLoaded, isSignedIn } = useUser();
	const router = useRouter();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [tagsInput, setTagsInput] = useState("");
	const [installCommand, setInstallCommand] = useState("");
	const [promptConfig, setPromptConfig] = useState("");
	const [usageExample, setUsageExample] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isLoaded) {
		return (
			<div id="new-skill" className="loading">
				<p>Loading user session...</p>
			</div>
		);
	}

	if (!isSignedIn) {
		return (
			<div id="new-skill">
				<Link to="/" className="back">
					<ArrowLeft size={16} />
					<span>Back to Registry</span>
				</Link>
				<div className="intro">
					<h1>Publish a new Skill</h1>
					<p>Share your agentic capabilities with the world.</p>
				</div>
				<div className="card">
					<p>You must be signed in to publish a new skill.</p>
					<div className="card-actions">
						<Link to="/sign-in/$" className="btn-primary">
							Sign In
						</Link>
						<Link to="/" className="btn-secondary">
							Cancel
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !installCommand.trim() || !promptConfig.trim() || !usageExample.trim()) {
			setError("Please fill out all required fields.");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		// Process tags: split by comma and clean up spaces
		const tags = tagsInput
			.split(",")
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0);

		try {
			const id = crypto.randomUUID();
			const createdAt = new Date().toISOString();

			await insertSkill(dataConnect, {
				id,
				authorClerkId: user.id,
				createdAt,
				title: title.trim(),
				description: description.trim() || null,
				tags,
				installCommand: installCommand.trim(),
				promptConfig: promptConfig.trim(),
				usageExample: usageExample.trim(),
			});

			router.navigate({ to: "/" });
		} catch (err: any) {
			console.error(err);
			setError(err.message || "Failed to publish skill. Please try again.");
			setIsSubmitting(false);
		}
	};

	return (
		<div id="new-skill">
			<Link to="/" className="back">
				<ArrowLeft size={16} />
				<span>Back to Registry</span>
			</Link>

			<div className="intro">
				<h1>Publish a new Skill</h1>
				<p>Configure and share reusable agentic capabilities.</p>
			</div>

			{error && <div className="alert error">{error}</div>}

			<form onSubmit={handleSubmit} className="content">
				<div className="block">
					{/* Title */}
					<div className="form-item">
						<label htmlFor="title" className="form-label">
							Skill Title *
						</label>
						<span className="form-description">
							Give your skill a clear, descriptive name. Example: "Web Scraping" or "PDF Parser".
						</span>
						<input
							type="text"
							id="title"
							className="input-field input-field-lg"
							placeholder="Enter skill title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							required
						/>
					</div>

					{/* Description */}
					<div className="form-item">
						<label htmlFor="description" className="form-label">
							Description
						</label>
						<span className="form-description">
							Explain what this skill does, its inputs/outputs, and target use cases.
						</span>
						<textarea
							id="description"
							className="input-field input-field-textarea input-field-description"
							placeholder="Describe the capabilities of this skill..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>

					{/* Tags */}
					<div className="form-item">
						<label htmlFor="tags" className="form-label">
							Tags
						</label>
						<span className="form-description">
							Add keywords to help others discover this skill. Separate with commas.
						</span>
						<input
							type="text"
							id="tags"
							className="input-field"
							placeholder="e.g. web-scraping, automation, pdf"
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
						/>
					</div>

					<div className="divider" />

					{/* Install Command */}
					<div className="form-item">
						<label htmlFor="installCommand" className="form-label">
							<Terminal size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
							Install Command *
						</label>
						<span className="form-description">
							The shell command to install this capability or its dependencies.
						</span>
						<input
							type="text"
							id="installCommand"
							className="input-field input-field-mono"
							placeholder="e.g. bun add @agent-capabilities/scraper"
							value={installCommand}
							onChange={(e) => setInstallCommand(e.target.value)}
							required
						/>
					</div>

					{/* System Prompt / Config */}
					<div className="form-item">
						<label htmlFor="promptConfig" className="form-label">
							<Settings size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
							System Prompt / Configuration *
						</label>
						<span className="form-description">
							The system instructions, tool definitions, or prompt template needed to operate this skill.
						</span>
						<textarea
							id="promptConfig"
							className="input-field input-field-textarea input-field-prompt input-field-mono"
							placeholder="Enter prompts, parameters, or system config..."
							value={promptConfig}
							onChange={(e) => setPromptConfig(e.target.value)}
							required
						/>
					</div>

					{/* Usage Example */}
					<div className="form-item">
						<label htmlFor="usageExample" className="form-label">
							<Code size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
							Usage Example *
						</label>
						<span className="form-description">
							A code snippet demonstrating how an agent imports and invokes this skill.
						</span>
						<textarea
							id="usageExample"
							className="input-field input-field-textarea input-field-usage input-field-mono"
							placeholder="const scraper = new Scraper();\nconst results = await scraper.run({ url: '...' });"
							value={usageExample}
							onChange={(e) => setUsageExample(e.target.value)}
							required
						/>
					</div>
				</div>

				<div className="actions">
					<button type="submit" className="btn-primary" disabled={isSubmitting}>
						<Sparkles size={16} />
						<span>{isSubmitting ? "Publishing..." : "Publish Skill"}</span>
					</button>
					<Link to="/" className="btn-secondary">
						Cancel
					</Link>
				</div>
			</form>
		</div>
	);
}
