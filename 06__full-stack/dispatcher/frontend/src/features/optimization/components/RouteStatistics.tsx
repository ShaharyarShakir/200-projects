import React from 'react';
import { Fuel, Coffee, Moon, DollarSign, Gauge, Clock } from 'lucide-react';
import type { OptimizationResult } from '../types/optimization';

interface RouteStatisticsProps {
  optimizationResult: OptimizationResult;
}

export const RouteStatistics: React.FC<RouteStatisticsProps> = ({ optimizationResult }) => {
  const {
    total_driving_hours,
    total_trip_hours,
    fuel_summary,
    rest_summary,
    optimized_stops,
  } = optimizationResult;

  const fuelStopsCount = optimized_stops.filter((s) => s.category === 'Fuel').length;
  const restStopsCount = optimized_stops.filter((s) => s.category === 'Rest Area').length;
  const sleepStopsCount = optimized_stops.filter((s) => s.category === 'Hotel').length;

  const stats = [
    {
      label: 'Fuel Stops',
      value: fuelStopsCount,
      sub: `${fuel_summary.gallons_needed} gal needed`,
      icon: Fuel,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Rest Breaks',
      value: restStopsCount,
      sub: `${rest_summary.breaks_30m_needed} x 30m HOS break`,
      icon: Coffee,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Sleep Rest',
      value: sleepStopsCount,
      sub: `${rest_summary.sleeps_10h_needed} x 10h sleeper berth`,
      icon: Moon,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Estimated Fuel Cost',
      value: `$${fuel_summary.estimated_fuel_cost}`,
      sub: `@ $${fuel_summary.avg_price_per_gallon}/gal`,
      icon: DollarSign,
      color: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Total Driving Time',
      value: `${total_driving_hours}h`,
      sub: `Avg 55 mph speed`,
      icon: Gauge,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Total Trip Elapsed',
      value: `${total_trip_hours}h`,
      sub: `Includes breaks & sleep`,
      icon: Clock,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`border rounded-xl p-3 flex flex-col justify-between ${stat.color} backdrop-blur-sm transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium opacity-80">{stat.label}</span>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-neutral-100">{stat.value}</div>
              <div className="text-[10px] opacity-70 truncate mt-0.5">{stat.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
