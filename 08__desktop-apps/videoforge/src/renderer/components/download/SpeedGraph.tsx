import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMetricsStore } from "../../stores/download-metrics.store";

export function formatSpeed(bytes: number) {
  if (!bytes || isNaN(bytes) || bytes < 0) return "0.00 MB/s";
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB/s`;
  }
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB/s`;
}

function formatTime(timestamp: number) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "";
  }
}

export default function SpeedGraph() {
  const points = useMetricsStore((state) => state.points);

  // Custom tooltips for premium feel
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/90 text-white p-3 border border-slate-700/50 rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold space-y-1 select-none">
          <p className="text-slate-400">{formatTime(data.timestamp)}</p>
          <p className="text-blue-400 text-sm">{formatSpeed(data.speed)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-60 w-full bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display">
            Real-Time Speed Analytics
          </h3>
          <p className="text-[11px] text-slate-400">
            Aggregated stream downloads speed in bytes per second
          </p>
        </div>
      </div>

      <div className="h-44 w-full">
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 select-none">
            No active downloads metrics available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} className="dark:stroke-slate-800/50" />

              <XAxis
                dataKey="timestamp"
                tickFormatter={(tick) => {
                  const d = new Date(tick);
                  return `${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
                }}
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickFormatter={(tick) => formatSpeed(tick).split(" ")[0]}
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="speed"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#speedGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
