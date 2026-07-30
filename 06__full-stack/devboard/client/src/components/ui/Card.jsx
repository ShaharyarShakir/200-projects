export default function Card({
  children,
  className = ""
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors ${className}`}
    >
      {children}
    </div>
  );
}
