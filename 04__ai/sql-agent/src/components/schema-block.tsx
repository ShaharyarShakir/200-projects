type SchemaPart = {
  type: "tool-schema";
  state: string;
};

export function SchemaBlock({ part }: { part: SchemaPart }) {
  const isDone = part.state === "output-available";

  return (
    <div
      className="rounded-[10px] w-full max-w-110 overflow-hidden text-xs"
      style={{ border: "1px solid var(--color-border)" }}>
      <div
        className="flex items-center gap-1.5 px-3 py-2.5 font-mono font-semibold text-[11px]"
        style={{
          background: "var(--color-magenta-dim)",
          color: "#e879f9",
        }}>
        <span>◈</span>
        <span className="flex-1">Schema Inspector</span>

        {isDone && (
          <span
            className="px-2 py-0.5 rounded font-mono text-[10px]"
            style={{
              background: "var(--color-magenta-dim)",
              border: "1px solid color-mix(in srgb, #d946ef 40%, transparent)",
              color: "#e879f9",
            }}>
            Loaded
          </span>
        )}
      </div>
    </div>
  );
}