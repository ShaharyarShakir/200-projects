type ChatInputProps = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
};

export function ChatInput({ value, onChange, onSubmit }: ChatInputProps) {
  return (
    <div
      className="px-6 pt-4 pb-6 border-t shrink-0"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          onSubmit();
        }}>
        {/* Input row */}
        <div
          className="flex items-center rounded-[10px] overflow-hidden transition-all duration-150"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-cyan)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-border)")
          }>
          {/* Prompt symbol */}
          <span
            className="px-3 font-mono text-sm select-none shrink-0"
            style={{ color: "var(--color-cyan)" }}>
            ›_
          </span>

          {/* Text input */}
          <input
            className="flex-1 bg-transparent py-3.5 border-none outline-none text-sm"
            style={{
              color: "var(--color-apptext)",
              fontFamily: "inherit",
            }}
            value={value}
            placeholder="Ask anything about your data…"
            onChange={(e) => onChange(e.currentTarget.value)}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!value.trim()}
            className="flex justify-center items-center m-1.5 border-none rounded-[7px] w-9 h-9 text-white text-lg transition-all duration-150 cursor-pointer disabled:cursor-default submit-btn shrink-0"
            style={
              !value.trim()
                ? {
                    background: "var(--color-surface-2)",
                    opacity: 0.4,
                  }
                : undefined
            }
            aria-label="Send">
            ↑
          </button>
        </div>

        {/* Hint */}
        <p
          className="pl-1 font-mono text-[10px]"
          style={{ color: "var(--color-muted)" }}>
          Try: &quot;Which products have the lowest inventory?&quot;
        </p>
      </form>
    </div>
  );
}