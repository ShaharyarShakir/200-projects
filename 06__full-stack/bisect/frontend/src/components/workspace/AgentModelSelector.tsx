"use client";

import React, { useState } from "react";
import { Bot, Cpu, Zap, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentModelOption {
  id: string;
  name: string;
  provider: "Anthropic" | "OpenAI" | "Google" | "Ollama";
  description: string;
  contextWindow: string;
  recommendedFor: string;
  isLocal?: boolean;
  badgeColor: string;
}

export const AGENT_MODELS: AgentModelOption[] = [
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    description: "Deep reasoning & hybrid thinking for complex regression bisecting.",
    contextWindow: "200k tokens",
    recommendedFor: "Bisecting & Repair Loops",
    badgeColor: "border-amber-700/50 bg-amber-950/30 text-amber-300",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o (Codex)",
    provider: "OpenAI",
    description: "Fast parallel reasoning and code patch generation.",
    contextWindow: "128k tokens",
    recommendedFor: "Rapid Code Synthesis",
    badgeColor: "border-emerald-700/50 bg-emerald-950/30 text-emerald-300",
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Massive context window ideal for sweeping large repo commit histories.",
    contextWindow: "1M tokens",
    recommendedFor: "Massive Log Traces",
    badgeColor: "border-blue-700/50 bg-blue-950/30 text-blue-300",
  },
  {
    id: "ollama-llama-3-3",
    name: "Llama 3.3 (Ollama)",
    provider: "Ollama",
    description: "100% local, air-gapped execution without external data transmission.",
    contextWindow: "128k tokens",
    recommendedFor: "Local Airgapped Sandbox",
    isLocal: true,
    badgeColor: "border-purple-700/50 bg-purple-950/30 text-purple-300",
  },
];

interface AgentModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (model: AgentModelOption) => void;
  disabled?: boolean;
}

export function AgentModelSelector({
  selectedModelId,
  onSelectModel,
  disabled = false,
}: AgentModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentModel =
    AGENT_MODELS.find((m) => m.id === selectedModelId) || AGENT_MODELS[0];

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-blue-400" />
          Agent Model & Router
        </label>
        <span className="text-[11px] text-slate-400 font-mono">
          {currentModel.contextWindow} ctx
        </span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select AI Model"
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-left text-sm text-slate-100 transition-colors hover:border-slate-600 focus:border-blue-500 focus:outline-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-300">
            {currentModel.isLocal ? (
              <Cpu className="h-3.5 w-3.5 text-purple-400" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-blue-400" />
            )}
          </div>
          <div className="truncate">
            <span className="font-medium text-slate-200">{currentModel.name}</span>
            <span className="ml-2 text-xs text-slate-400">({currentModel.provider})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
              currentModel.badgeColor
            )}
          >
            {currentModel.isLocal ? "Local Engine" : "Cloud Hosted"}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            className="absolute left-0 right-0 z-30 mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-slate-700 bg-[#0b1220] p-1.5 shadow-xl shadow-black/80 backdrop-blur-md"
          >
            {AGENT_MODELS.map((model) => {
              const isSelected = model.id === currentModel.id;
              return (
                <li
                  key={model.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectModel(model);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-md p-2.5 text-xs transition-colors",
                    isSelected
                      ? "bg-blue-600/20 text-slate-100"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">
                        {model.name}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.2 text-[10px]",
                          model.badgeColor
                        )}
                      >
                        {model.provider}
                      </span>
                      {model.isLocal && (
                        <span className="rounded bg-purple-900/40 text-purple-300 px-1.5 py-0.2 text-[10px] font-mono border border-purple-700/40">
                          Airgapped
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                  </div>

                  <p className="text-[11px] text-slate-400">{model.description}</p>

                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>Context: {model.contextWindow}</span>
                    <span>•</span>
                    <span className="text-slate-300">Best: {model.recommendedFor}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
