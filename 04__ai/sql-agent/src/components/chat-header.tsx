export function ChatHeader() {
  return (
    <header className="flex justify-between items-center px-6 py-3.5 border-b shrink-0"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 font-mono font-semibold text-sm tracking-wide">
        {/* Gradient hex icon */}
        <span
          className="text-xl select-none"
          style={{
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          ⬡
        </span>
        <span
          style={{
            background: "var(--gradient-text)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          SQLAgent
        </span>
      </div>

      {/* Connection status */}
      <div
        className="flex items-center gap-1.5 font-mono text-xs"
        style={{ color: "var(--color-muted)" }}>
        <span
          className="rounded-full w-1.5 h-1.5 shrink-0"
          style={{
            background: "var(--color-green)",
            boxShadow: "0 0 6px var(--color-green)",
          }}
        />
        Connected
      </div>
    </header>
  );
}