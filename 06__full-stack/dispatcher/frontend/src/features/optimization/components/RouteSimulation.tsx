import React, { useState, useEffect } from 'react';
import type { Stop } from '../types/optimization';
import { Play, Pause, RotateCcw, Navigation, CheckCircle } from 'lucide-react';

interface RouteSimulationProps {
  stops: Stop[];
  onActiveStopChange?: (stop: Stop | null, index: number) => void;
  onClose?: () => void;
}

export const RouteSimulation: React.FC<RouteSimulationProps> = ({
  stops,
  onActiveStopChange,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  const activeStop = stops[currentIndex] || null;

  useEffect(() => {
    if (onActiveStopChange) {
      onActiveStopChange(activeStop, currentIndex);
    }
  }, [currentIndex, activeStop]);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      const intervalMs = Math.max(800, 2500 / speed);
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= stops.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speed, stops.length]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const progressPercent =
    stops.length > 1 ? Math.round((currentIndex / (stops.length - 1)) * 100) : 0;

  return (
    <div className="bg-neutral-900 border border-brand-500/50 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-400 animate-bounce" />
          <h3 className="text-base font-bold text-neutral-100">Live Route Schedule Simulation</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Step {currentIndex + 1} of {stops.length}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-neutral-400">
          <span>{stops[0]?.name || 'Origin'}</span>
          <span>{progressPercent}% Complete</span>
          <span>{stops[stops.length - 1]?.name || 'Destination'}</span>
        </div>
        <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Stage Banner */}
      {activeStop && (
        <div className="bg-neutral-800/80 border border-neutral-700 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Current Stage: {activeStop.category}
            </div>
            <div className="text-base font-bold text-neutral-100 mt-0.5">{activeStop.name}</div>
            <div className="text-xs text-neutral-400 mt-1">
              Mile {activeStop.distance_from_start} • Duration: {activeStop.duration * 60}m
              {activeStop.arrival_time && (
                <span>
                  {' '}
                  • Arrival:{' '}
                  {new Date(activeStop.arrival_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      )}

      {/* Playback Control Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'Pause' : 'Play Simulation'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all cursor-pointer"
            title="Reset to Start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400 font-medium">Speed:</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                speed === s
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
