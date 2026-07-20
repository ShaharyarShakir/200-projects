import React, { useState } from 'react';
import { useGenerateSchedule } from '../hooks/useHos';
import { Timeline } from '../components/timeline/Timeline';
import { RemainingHoursCard } from '../components/cards/RemainingHoursCard';
import { TripClock } from '../components/cards/TripClock';
import { HOSScheduleResponse } from '../types/hos';
import {
  Clock,
  Gauge,
  Fuel,
  Play,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export const HosPage: React.FC = () => {
  // Assessment Default Preset: Distance: 1842, Duration: 27.4, Cycle Used: 25
  const [distance, setDistance] = useState<number>(1842);
  const [duration, setDuration] = useState<number>(27.4);
  const [cycleUsed, setCycleUsed] = useState<number>(25);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [scheduleResult, setScheduleResult] = useState<HOSScheduleResponse | null>(null);

  const generateMutation = useGenerateSchedule();

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    // Frontend Validations
    if (distance <= 0) {
      setValidationError('Distance must be greater than 0.');
      return;
    }
    if (duration <= 0) {
      setValidationError('Duration must be greater than 0.');
      return;
    }
    if (cycleUsed < 0) {
      setValidationError('Cycle hours cannot be negative.');
      return;
    }
    if (cycleUsed > 70) {
      setValidationError('Cycle hours cannot exceed 70 hours.');
      return;
    }

    generateMutation.mutate(
      { distance, duration, cycle_used: cycleUsed },
      {
        onSuccess: (data) => {
          setScheduleResult(data);
        },
        onError: (err: any) => {
          const apiErr = err.response?.data?.error || err.message || 'Schedule generation failed.';
          setValidationError(apiErr);
        },
      }
    );
  };

  const handlePresetScenario = () => {
    setDistance(1842);
    setDuration(27.4);
    setCycleUsed(25);
    setValidationError(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 border border-brand-200 text-brand-600">
              <ShieldCheck className="w-3.5 h-3.5" /> FMCSA Hours of Service Engine
            </span>
            <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mt-2">
              HOS Engine & Driver Schedule Generator
            </h1>
            <p className="text-xs text-neutral-400">
              Calculate FMCSA 11h driving, 14h duty window, mandatory 30m break, 10h sleeper berth, 1000mi fuel stops, and 70h/8d cycle limits.
            </p>
          </div>

          <button
            onClick={handlePresetScenario}
            className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-600" /> Assessment Sample (1,842 mi / 27.4h / 25h cycle)
          </button>
        </div>
      </div>

      {/* Input Form & Driver Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs Panel */}
        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-brand-600" /> Engine Inputs
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Trip Distance (miles / km)
              </label>
              <input
                type="number"
                step="any"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-0 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-600"
                placeholder="e.g. 1842"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Estimated Driving Duration (hours)
              </label>
              <input
                type="number"
                step="any"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-0 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-600"
                placeholder="e.g. 27.4"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Current Cycle Hours Used (0 - 70)
              </label>
              <input
                type="number"
                step="any"
                value={cycleUsed}
                onChange={(e) => setCycleUsed(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-0 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-600"
                placeholder="e.g. 25"
              />
            </div>

            {(validationError || generateMutation.isError) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{validationError || (generateMutation.error as any)?.message || 'Schedule failed.'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="w-full bg-brand-600 hover:bg-brand-700 text-neutral-0 font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-0 border-t-transparent rounded-full animate-spin"></div>
                  <span>Calculating HOS Schedule...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Generate HOS Schedule
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dashboard Progress Bars & Clock Panel */}
        <div className="lg:col-span-2 space-y-6">
          <RemainingHoursCard
            status={scheduleResult?.status || null}
            initialCycleUsed={cycleUsed}
            finalCycleUsed={scheduleResult?.final_cycle_used || 0}
            totalDriveHours={duration}
            totalDutyHours={scheduleResult?.total_trip_elapsed_hours || 0}
          />

          <TripClock
            startTime={scheduleResult?.start_time}
            endTime={scheduleResult?.end_time}
            totalElapsedHours={scheduleResult?.total_trip_elapsed_hours || 0}
            totalDistance={scheduleResult?.distance || distance}
          />
        </div>
      </div>

      {/* Generated Timeline Section */}
      <section id="hos-timeline-section">
        <Timeline
          events={scheduleResult?.events || []}
          isLoading={generateMutation.isPending}
        />
      </section>
    </div>
  );
};
