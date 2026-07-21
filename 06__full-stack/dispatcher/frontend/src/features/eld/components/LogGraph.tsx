import React, { useState } from 'react';
import type { ELDGraphSegment, DutyStatus } from '../types/eld';

interface LogGraphProps {
  graphData: ELDGraphSegment[];
  dayNumber: number;
  dateStr: string;
}

const ROW_Y_MAP: Record<DutyStatus, number> = {
  OFF_DUTY: 0,
  SLEEPER_BERTH: 1,
  DRIVING: 2,
  ON_DUTY: 3,
};

const ROW_LABELS: Record<DutyStatus, string> = {
  OFF_DUTY: '1. OFF DUTY',
  SLEEPER_BERTH: '2. SLEEPER',
  DRIVING: '3. DRIVING',
  ON_DUTY: '4. ON DUTY',
};

export const LogGraph: React.FC<LogGraphProps> = ({ graphData, dayNumber, dateStr }) => {
  const [activeSegment, setActiveSegment] = useState<ELDGraphSegment | null>(null);

  const width = 850;
  const height = 180;

  const margin = { left: 110, right: 60, top: 30, bottom: 30 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const rowH = chartH / 4.0;

  const getX = (hour: number) => margin.left + (hour / 24.0) * chartW;
  const getY = (status: DutyStatus) => {
    const idx = ROW_Y_MAP[status] ?? 0;
    return margin.top + (idx + 0.5) * rowH;
  };

  // Row Totals
  const totals: Record<DutyStatus, number> = {
    OFF_DUTY: 0,
    SLEEPER_BERTH: 0,
    DRIVING: 0,
    ON_DUTY: 0,
  };

  graphData.forEach((seg) => {
    if (totals[seg.status] !== undefined) {
      totals[seg.status] += seg.duration;
    }
  });

  // Build path d
  let pathD = '';
  let prevX: number | null = null;
  let prevY: number | null = null;

  graphData.forEach((seg) => {
    const x1 = getX(seg.start_hour);
    const x2 = getX(seg.end_hour);
    const y = getY(seg.status);

    if (prevX !== null && prevY !== null) {
      pathD += ` M ${prevX.toFixed(2)} ${prevY.toFixed(2)} L ${x1.toFixed(2)} ${y.toFixed(2)}`;
    }

    pathD += ` M ${x1.toFixed(2)} ${y.toFixed(2)} L ${x2.toFixed(2)} ${y.toFixed(2)}`;

    prevX = x2;
    prevY = y;
  });

  const hoursArray = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold rounded-lg">
            Day #{dayNumber}
          </span>
          <h3 className="text-sm font-bold text-neutral-100 tracking-tight">
            24-Hour Duty Status Graph Grid ({dateStr})
          </h3>
        </div>

        {activeSegment && (
          <div className="text-xs font-mono bg-brand-500/20 border border-brand-500/40 text-brand-300 px-3 py-1 rounded-lg flex items-center gap-2 animate-pulse">
            <span className="font-semibold">{activeSegment.status.replace('_', ' ')}:</span>
            <span>
              {activeSegment.start_hour.toFixed(2)}h - {activeSegment.end_hour.toFixed(2)}h ({activeSegment.duration.toFixed(2)}h)
            </span>
            {activeSegment.location && <span className="text-brand-400">📍 {activeSegment.location}</span>}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[700px] select-none font-sans">
          {/* Background Grid Box */}
          <rect
            x={margin.left}
            y={margin.top}
            width={chartW}
            height={chartH}
            fill="#090d16"
            stroke="#1f2937"
            strokeWidth="1.5"
            rx="4"
          />

          {/* Row Dividers & Labels */}
          {(['OFF_DUTY', 'SLEEPER_BERTH', 'DRIVING', 'ON_DUTY'] as DutyStatus[]).map((st, idx) => {
            const yCenter = margin.top + (idx + 0.5) * rowH;
            const yDiv = margin.top + idx * rowH;

            return (
              <g key={st}>
                {idx > 0 && (
                  <line
                    x1={margin.left}
                    y1={yDiv}
                    x2={margin.left + chartW}
                    y2={yDiv}
                    stroke="#1f2937"
                    strokeWidth="1"
                  />
                )}
                {/* Row Label */}
                <text
                  x={margin.left - 10}
                  y={yCenter + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="700"
                  fill="#9ca3af"
                >
                  {ROW_LABELS[st]}
                </text>
                {/* Row Total Hours on Right */}
                <text
                  x={margin.left + chartW + 15}
                  y={yCenter + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="800"
                  fill="#f3f4f6"
                >
                  {totals[st].toFixed(1)}h
                </text>
              </g>
            );
          })}

          {/* Column Ticks & Numbers */}
          {hoursArray.map((hr) => {
            const x = getX(hr);
            const isMajor = hr % 2 === 0 || hr === 24;
            const labelStr = hr === 0 || hr === 24 ? 'M' : hr === 12 ? 'N' : hr.toString();

            return (
              <g key={hr}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + chartH}
                  stroke={hr % 2 !== 0 ? '#111827' : '#1f2937'}
                  strokeWidth={hr % 2 !== 0 ? '0.75' : '1.5'}
                />

                {isMajor && (
                  <>
                    <text
                      x={x}
                      y={margin.top - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#6b7280"
                    >
                      {labelStr}
                    </text>
                    <text
                      x={x}
                      y={margin.top + chartH + 16}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      fill="#6b7280"
                    >
                      {labelStr}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Interactive Segment Hover Blocks */}
          {graphData.map((seg, idx) => {
            const x1 = getX(seg.start_hour);
            const x2 = getX(seg.end_hour);
            const rowIdx = ROW_Y_MAP[seg.status] ?? 0;
            const yTop = margin.top + rowIdx * rowH;

            return (
              <rect
                key={idx}
                x={x1}
                y={yTop}
                width={Math.max(x2 - x1, 2)}
                height={rowH}
                fill="transparent"
                className="hover:fill-sky-500/20 cursor-pointer transition-all"
                onMouseEnter={() => setActiveSegment(seg)}
                onMouseLeave={() => setActiveSegment(null)}
              />
            );
          })}

          {/* Duty Status Glowing Sky Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-sky-400 rounded-full inline-block shadow-sm shadow-sky-400/50"></span> Continuous Duty Line
        </span>
        <span>Grid Resolution: 15-Minute Ticks (00:00 - 24:00)</span>
      </div>
    </div>
  );
};
