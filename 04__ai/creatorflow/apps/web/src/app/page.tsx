"use client";

import { ChangeEvent,  useState } from "react";
import { createProject } from "@/lib/api";

export default function Home() {
const [idea, setIdea] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [projectId, setProjectId] = useState("");
 async function handleSubmit(event: ChangeEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!idea.trim()) {
    setError("Please enter an idea.");
    return;
  }

  setLoading(true);
  setError("");
  setProjectId("");

  try {
    const project = await createProject(idea.trim());

    setProjectId(project.id);
    setIdea("");
  } catch (error) {
    console.error(error);
    setError("Unable to create project.");
  } finally {
    setLoading(false);
  }
}
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12">
          <p className="mb-3 text-sm font-medium text-blue-400">
            CREATORFLOW
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Turn ideas into approved videos.
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            Create content with AI, review it, and keep the final decision
            in your hands.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Create a project</h2>

            <p className="mt-2 text-sm text-slate-400">
              Start with an idea. We’ll turn it into a structured script.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="idea"
                  className="mb-2 block text-sm font-medium"
                >
                  What do you want to create?
                </label>

                <textarea
                  id="idea"
                  value={idea}
                  onChange={(event) => setIdea(event.target.value)}
                  placeholder="Example: Make a 30-second motivational video about discipline."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

             <button
  type="submit"
  disabled={loading}
  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
>
  {loading ? "Creating..." : "Create project"}
</button>
{error && (
  <p className="text-sm text-red-400">
    {error}
  </p>
)}

{projectId && (
  <div className="rounded-xl border border-green-800 bg-green-950/30 p-4">
    <p className="text-sm text-green-400">
      Project created successfully.
    </p>

    <p className="mt-1 break-all text-xs text-slate-400">
      ID: {projectId}
    </p>
  </div>
)}
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Your workflow</h2>

            <div className="mt-6 space-y-4">
              {[
                "Idea",
                "Script",
                "AI Review",
                "Approval",
                "Video",
              ].map((stage, index) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm text-slate-400">
                    {index + 1}
                  </div>

                  <span className="text-sm text-slate-300">{stage}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}