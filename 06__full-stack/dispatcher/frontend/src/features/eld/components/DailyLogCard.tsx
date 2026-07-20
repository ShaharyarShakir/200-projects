import React from 'react';
import type { DailyLog } from '../types/eld';
import { DriverCard } from './DriverCard';
import { LogGraph } from './LogGraph';
import { LogSummary } from './LogSummary';
import { DutyTimeline } from './DutyTimeline';

interface DailyLogCardProps {
  log: DailyLog;
}

export const DailyLogCard: React.FC<DailyLogCardProps> = ({ log }) => {
  return (
    <div className="space-y-6">
      <DriverCard driverInfo={log.driver_info} tripInfo={log.trip_info} />

      <LogGraph
        graphData={log.graph_data || []}
        dayNumber={log.day_number}
        dateStr={log.date}
      />

      <LogSummary summary={log.summary} />

      <DutyTimeline events={log.duty_events || []} />
    </div>
  );
};
