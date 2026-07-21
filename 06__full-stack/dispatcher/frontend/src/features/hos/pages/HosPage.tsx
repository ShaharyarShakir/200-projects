import React, { useState, useEffect } from 'react';
import { useGenerateSchedule } from '../hooks/useHos';
import { useGenerateELDLogs } from '../../eld/hooks/useELD';
import { Timeline } from '../components/timeline/Timeline';
import { RemainingHoursCard } from '../components/cards/RemainingHoursCard';
import { TripClock } from '../components/cards/TripClock';
import { ELDViewer } from '../../eld/components/ELDViewer';
import type { HOSScheduleResponse } from '../types/hos';
import type { DailyLog } from '../../eld/types/eld';
import {
  Gauge,
  Play,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  FileSpreadsheet,
  Route,
} from 'lucide-react';

export const HosPage: React.FC = () => {
  // Assessment Default Preset: Distance: 1842, Duration: 27.4, Cycle Used: 25
  const [distance, setDistance] = useState<number>(1842);
  const [duration, setDuration] = useState<number>(27.4);
  const [cycleUsed, setCycleUsed] = useState<number>(25);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [scheduleResult, setScheduleResult] = useState<HOSScheduleResponse | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [activeTab, setActiveTab] = useState<'eld-logs' | 'hos-timeline'>('eld-logs');

  const generateHosMutation = useGenerateSchedule();
  const generateEldMutation = useGenerateELDLogs();

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

    generateHosMutation.mutate(
      { distance, duration, cycle_used: cycleUsed },
      {
        onSuccess: (hosData) => {
          setScheduleResult(hosData);

          // Generate ELD Daily Logs
          generateEldMutation.mutate(
            { distance, duration, cycle_used: cycleUsed },
            {
              onSuccess: (eldData) => {
                setDailyLogs(eldData.logs || []);
              },
              onError: (err: any) => {
                console.error('ELD log generation failed:', err);
              },
            }
          );
        },
        onError: (err: any) => {
          const apiErr = err.response?.data?.error || err.message || 'Schedule generation failed.';
          setValidationError(apiErr);
        },
      }
    );
  };

  // Generate default preset scenario on mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const handlePresetScenario = () => {
    setDistance(1842);
    setDuration(27.4);
    setCycleUsed(25);
    setValidationError(null);
  };

  const isLoading = generateHosMutation.isPending || generateEldMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 border border-brand-500/30 text-brand-300">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> FMCSA Hours of Service & ELD Log Engine
            </span>
            <h1 className="text-2xl font-extrabold text-neutral-100 tracking-tight mt-2">
              ELD Log Generator & Daily Log Sheets
            </h1>
            <p className="text-xs text-neutral-400">
              Generate FMCSA 24-hour daily log sheets, 4-row duty status graphs (Off Duty, Sleeper, Driving, On Duty), multi-day tabs, and printable PDF logs.
            </p>
          </div>

          <button
            onClick={handlePresetScenario}
            className="bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-400" /> Assessment Sample (1,842 mi / 27.4h / 25h cycle)
          </button>
        </div>
      </div>

      {/* Input Form & Driver Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs Panel */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-brand-400" /> Engine Inputs
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Trip Distance (miles / km)
              </label>
              <input
                type="number"
                step="any"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm font-mono text-neutral-100 focus:outline-none focus:border-brand-500"
                placeholder="e.g. 1842"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Estimated Driving Duration (hours)
              </label>
              <input
                type="number"
                step="any"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm font-mono text-neutral-100 focus:outline-none focus:border-brand-500"
                placeholder="e.g. 27.4"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Current Cycle Hours Used (0 - 70)
              </label>
              <input
                type="number"
                step="any"
                value={cycleUsed}
                onChange={(e) => setCycleUsed(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm font-mono text-neutral-100 focus:outline-none focus:border-brand-500"
                placeholder="e.g. 25"
              />
            </div>

            {(validationError || generateHosMutation.isError || generateEldMutation.isError) && (
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{validationError || (generateHosMutation.error as any)?.message || 'Generation failed.'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating ELD Logs & HOS Schedule...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Generate FMCSA Daily Logs
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

      {/* Main Content Tabs: ELD Logs vs Driving Timeline */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('eld-logs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
              activeTab === 'eld-logs'
                ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>FMCSA Daily Log Sheets</span>
            {dailyLogs.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'eld-logs' ? 'bg-brand-700 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                {dailyLogs.length} Days
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('hos-timeline')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
              activeTab === 'hos-timeline'
                ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Route className="w-4 h-4" />
            <span>Driving Timeline Event Log</span>
          </button>
        </div>

        {activeTab === 'eld-logs' && (
          <ELDViewer
            logs={dailyLogs}
            tripId={scheduleResult?.trip_id || null}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'hos-timeline' && (
          <Timeline
            events={scheduleResult?.events || []}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
