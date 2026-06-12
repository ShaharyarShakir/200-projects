"use client";

import { useMemo } from "react";
import { DbQueryBlock } from "./db-query-block";
import { SchemaBlock } from "./schema-block";
import { parseMarkdown, hasMarkdown } from "@/lib/markdown";

type MessagePart = {
  type: string;
  text?: string;
  input?: unknown;
  state?: string;
  output?: unknown;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: MessagePart[];
};

// ── Markdown text bubble ──────────────────────────────────────────────────────

function MarkdownBubble({
  text,
  isUser,
}: {
  text: string;
  isUser: boolean;
}) {
  // Only parse markdown for assistant messages that actually contain markdown syntax
  const shouldParse = !isUser && hasMarkdown(text);

  const html = useMemo(() => {
    if (!shouldParse) return null;
    return parseMarkdown(text);
  }, [text, shouldParse]);

  if (shouldParse && html) {
    return (
      <div
        className="px-3.5 py-3 rounded-xl text-sm leading-relaxed prose-md"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-apptext)",
        }}
        // DOMPurify-sanitized HTML — safe to inject
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Plain text fallback (user messages or simple assistant text)
  return (
    <p
      className="px-3.5 py-3 rounded-xl text-sm leading-relaxed"
      style={
        isUser
          ? {
              background: "var(--color-cyan-dim)",
              border: "1px solid color-mix(in srgb, var(--color-cyan) 35%, transparent)",
              color: "var(--color-apptext)",
            }
          : {
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-apptext)",
            }
      }>
      {text}
    </p>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className="flex justify-center items-center rounded-lg w-8 h-8 font-mono font-semibold text-[10px] shrink-0"
        style={
          isUser
            ? {
                background: "var(--color-cyan-dim)",
                color: "var(--color-cyan)",
                border: "1px solid color-mix(in srgb, var(--color-cyan) 40%, transparent)",
              }
            : {
                background: "var(--color-purple-dim)",
                color: "var(--color-purple)",
                border: "1px solid color-mix(in srgb, var(--color-purple) 40%, transparent)",
              }
        }>
        {isUser ? "U" : "AI"}
      </div>

      {/* Message body */}
      <div
        className={`max-w-140 flex flex-col gap-2 ${isUser ? "items-end" : ""}`}>
        {message.parts.map((part, i) => {
          const key = `${message.id}-${i}`;

          switch (part.type) {
            case "text":
              return (
                <MarkdownBubble
                  key={key}
                  text={part.text ?? ""}
                  isUser={isUser}
                />
              );

            case "tool-db":
              return (
                <DbQueryBlock
                  key={key}
                  part={
                    part as Parameters<typeof DbQueryBlock>[0]["part"]
                  }
                />
              );

            case "tool-schema":
              return (
                <SchemaBlock
                  key={key}
                  part={
                    part as Parameters<typeof SchemaBlock>[0]["part"]
                  }
                />
              );

            case "step-start":
              return (
                <div
                  key={key}
                  className="flex gap-1.5 px-3.5 py-3 rounded-xl w-fit"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                  }}>
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}