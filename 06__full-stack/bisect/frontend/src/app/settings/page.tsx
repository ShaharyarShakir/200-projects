"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/lib/auth/useAuth";
import {
  Shield,
  Github,
  Database,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Save,
} from "lucide-react";

function SettingsContent() {
  const { user } = useAuth();

  // Multi-Provider state
  const [anthropicKey, setAnthropicKey] = useState("sk-ant-api03-••••••••••••••••");
  const [openaiKey, setOpenaiKey] = useState("sk-proj-••••••••••••••••");
  const [geminiKey, setGeminiKey] = useState("AIzaSy••••••••••••••••");
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434");
  const [showKeys, setShowKeys] = useState<{ [k: string]: boolean }>({});

  // Sandbox settings
  const [sandboxTimeout, setSandboxTimeout] = useState("300");
  const [containerImage, setContainerImage] = useState("ghcr.io/bisect/sandbox-runner:latest");
  const [memoryLimit, setMemoryLimit] = useState("2048");

  // Safety Gates
  const [gateDestructiveCommands, setGateDestructiveCommands] = useState(true);
  const [gateGitPush, setGateGitPush] = useState(true);
  const [gateExternalNetwork, setGateExternalNetwork] = useState(false);

  const [savedBanner, setSavedBanner] = useState(false);

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Settings
            </h1>
            <p className="text-sm text-slate-400">
              Manage multi-provider API keys, Podman container sandbox, and human-in-the-loop safety gates.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Save className="h-3.5 w-3.5" />
            Save Preferences
          </button>
        </div>

        {savedBanner && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/60 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Configuration preferences updated and applied to agent runner.
          </div>
        )}

        <div className="space-y-6">
          {/* AI Providers & Model Routing */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-4">
              <Key className="h-5 w-5 text-blue-400" />
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  AI Model Providers & Credentials
                </h2>
                <p className="text-xs text-slate-400">
                  Configure API keys for multi-model routing. Stored securely and local-first.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Anthropic Claude */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Anthropic API Key (Claude 3.7 Sonnet / Opus)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showKeys.anthropic ? "text" : "password"}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("anthropic")}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-400 hover:text-white"
                  >
                    {showKeys.anthropic ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* OpenAI */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    OpenAI API Key (GPT-4o / Codex)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showKeys.openai ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("openai")}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-400 hover:text-white"
                  >
                    {showKeys.openai ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Google Gemini */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Google Gemini API Key (Gemini 2.5 Flash / Pro)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type={showKeys.gemini ? "text" : "password"}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("gemini")}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-slate-400 hover:text-white"
                  >
                    {showKeys.gemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Local Ollama Endpoint */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Ollama Local Endpoint (Llama 3.3 / Airgapped)
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">Local Network</span>
                </div>
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Podman Sandbox & Execution Limits */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-4">
              <Database className="h-5 w-5 text-blue-400" />
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Podman Sandbox & Isolation Policy
                </h2>
                <p className="text-xs text-slate-400">
                  Resource limits and container environment for isolated agent execution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Container Image
                </label>
                <input
                  type="text"
                  value={containerImage}
                  onChange={(e) => setContainerImage(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Max Execution Timeout (Seconds)
                </label>
                <input
                  type="number"
                  value={sandboxTimeout}
                  onChange={(e) => setSandboxTimeout(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Memory Limit (MB)
                </label>
                <input
                  type="number"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Live Polling Cadence
                </label>
                <span className="block py-1.5 font-mono text-slate-400">2,000 ms</span>
              </div>
            </div>
          </div>

          {/* Human-in-the-Loop & Safety Gates */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-4">
              <Shield className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Human-in-the-Loop Approval Gates
                </h2>
                <p className="text-xs text-slate-400">
                  Enforce explicit developer approval before sensitive or irreversible actions.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Gate Destructive Commands (`rm`, `drop`, `truncate`)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Pause agent and require manual approval before running filesystem deletions.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={gateDestructiveCommands}
                  onChange={(e) => setGateDestructiveCommands(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Gate Git Push & Remote Branch Mutations
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Agent cannot push commits or create remote PRs without explicit confirmation.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={gateGitPush}
                  onChange={(e) => setGateGitPush(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Gate Outbound Network Calls
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Intercept curl / wget requests initiated inside the container sandbox.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={gateExternalNetwork}
                  onChange={(e) => setGateExternalNetwork(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* GitHub Integration */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-4">
              <Github className="h-5 w-5 text-slate-300" />
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  GitHub Integration
                </h2>
                <p className="text-xs text-slate-400">
                  Connected GitHub OAuth account and permissions.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 text-xs">Connected Account</span>
                <span className="font-mono text-xs text-slate-200">
                  {user ? `@${user.github_username}` : "Not signed in"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 text-xs">Git Safety Mode</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-0.5 text-xs text-emerald-300">
                  <Shield className="h-3 w-3" />
                  Human Git Ownership (Read-only Agent)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}

export default SettingsPage;
