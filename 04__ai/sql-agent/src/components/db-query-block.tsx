type AIInput = { query: string };
type AIOutput = { rows: string[] };

type DbToolPart = {
  type: "tool-db";
  input: unknown;
  state: string;
  output: unknown;
};

const isAIInput = (value: unknown): value is AIInput =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { query?: unknown }).query === "string";

const isAIOutput = (value: unknown): value is AIOutput =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { rows?: unknown }).rows) &&
  (value as { rows: unknown[] }).rows.every((item) => typeof item === "string");

export function DbQueryBlock({ part }: { part: DbToolPart }) {
  const input = isAIInput(part.input) ? part.input : null;
  const output = isAIOutput(part.output) ? part.output : null;
  const isDone = part.state === "output-available";

  return (
    <div
      className="rounded-[10px] w-full max-w-110 overflow-hidden text-xs"
      style={{ border: "1px solid var(--color-border)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-3 py-2.5 font-mono font-semibold text-[11px]"
        style={{
          background: "var(--color-blue-dim)",
          color: "#93c5fd",
        }}>
        <span
          style={{
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          ⬡
        </span>
        <span className="flex-1">SQL Query</span>

        {isDone ? (
          <span
            className="px-2 py-0.5 rounded font-mono text-[10px]"
            style={{
              background: "var(--color-green-dim)",
              border: "1px solid color-mix(in srgb, var(--color-green) 40%, transparent)",
              color: "var(--color-green)",
            }}>
            {output?.rows?.length ?? 0} rows
          </span>
        ) : (
          <span
            className="px-2 py-0.5 rounded font-mono text-[10px] animate-pulse-badge"
            style={{
              background: "var(--color-blue-dim)",
              border: "1px solid color-mix(in srgb, #2563eb 40%, transparent)",
              color: "#93c5fd",
            }}>
            Running…
          </span>
        )}
      </div>

      {/* SQL code */}
      {input?.query && (
        <pre
          className="px-3 py-2.5 overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre"
          style={{
            background: "var(--color-code-bg)",
            borderTop: "1px solid var(--color-border)",
            color: "#a5f3fc",
          }}>
          {input.query}
        </pre>
      )}
    </div>
  );
}