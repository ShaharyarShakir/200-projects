import React from 'react';
import type { ELDDriverInfo, ELDTripInfo } from '../types/eld';
import { User, Truck, Building2, MapPin } from 'lucide-react';

interface DriverCardProps {
  driverInfo: ELDDriverInfo;
  tripInfo: ELDTripInfo;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driverInfo, tripInfo }) => {
  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h3 className="text-sm font-bold text-neutral-800 tracking-tight flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" /> Driver & Vehicle Information
        </h3>
        <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
          Carrier: {driverInfo?.carrier || 'Apex Logistics Inc.'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Driver Details */}
        <div className="bg-neutral-100/60 p-3 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-neutral-400">Driver</p>
          <p className="font-bold text-neutral-900 text-sm">{driverInfo?.name || 'John Doe'}</p>
          <p className="text-neutral-500 font-mono">License: {driverInfo?.license || 'DL-987654321'}</p>
        </div>

        {/* Carrier Details */}
        <div className="bg-neutral-100/60 p-3 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-neutral-400">Carrier & Terminal</p>
          <p className="font-bold text-neutral-900 text-sm flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-brand-600" /> {driverInfo?.carrier || 'Apex Logistics Inc.'}
          </p>
          <p className="text-neutral-500">Terminal: {driverInfo?.home_terminal || 'Chicago, IL'}</p>
        </div>

        {/* Vehicle Details */}
        <div className="bg-neutral-100/60 p-3 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-neutral-400">Tractor & Trailer</p>
          <p className="font-bold text-neutral-900 text-sm flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-brand-600" /> {driverInfo?.vehicle_number || 'Truck #402'}
          </p>
          <p className="text-neutral-500 font-mono">Trailer: {driverInfo?.trailer_number || 'TR-881'}</p>
        </div>

        {/* Trip Route */}
        <div className="bg-neutral-100/60 p-3 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-neutral-400">Trip Route</p>
          <p className="font-bold text-neutral-900 text-xs flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {tripInfo?.pickup || 'Pickup'} → {tripInfo?.dropoff || 'Dropoff'}
          </p>
          <p className="text-neutral-500 font-mono">Distance: {tripInfo?.distance || 0} mi</p>
        </div>
      </div>
    </div>
  );
};
