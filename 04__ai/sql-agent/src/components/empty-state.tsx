const SUGGESTIONS = [
  "Show me total sales by region last quarter",
  "Which products have the lowest inventory?",
  "List all customers who have not ordered in 60 days",
  "Compare revenue: this month vs last month",
];

type EmptyStateProps = {
  onSuggestion: (text: string) => void;
};

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col justify-center items-center px-6 py-10 h-full min-h-100 text-center">
      {/* Icon */}
      <div
        className="mb-5 text-5xl select-none"
        style={{
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          opacity: 0.85,
        }}>
        ⬡
      </div>

      <h2
        className="mb-2 font-semibold text-xl"
        style={{ color: "var(--color-apptext)" }}>
        Ask your database anything
      </h2>

      <p
        className="mb-8 text-sm"
        style={{ color: "var(--color-muted)" }}>
        No SQL required. Just ask in plain English.
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-col gap-2.5 w-full max-w-120">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-4 py-2.5 rounded-lg text-sm text-left transition-all duration-150 cursor-pointer"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-purple-dim)";
              e.currentTarget.style.borderColor = "var(--color-border-hover)";
              e.currentTarget.style.color = "var(--color-apptext)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-surface)";
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-muted)";
            }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}