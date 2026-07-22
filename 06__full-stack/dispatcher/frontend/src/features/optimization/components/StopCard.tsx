import React from 'react';
import type { Stop, StopCategory } from '../types/optimization';
import {
  Fuel,
  Truck,
  Coffee,
  SquareParking,
  Hotel,
  Utensils,
  Wrench,
  Star,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';

interface StopCardProps {
  stop: Stop;
  isActive?: boolean;
  onSelect?: () => void;
  onLockToggle?: (stopId: string, locked: boolean) => void;
  onEdit?: (stop: Stop) => void;
  onDelete?: (stopId: string) => void;
}

export const getCategoryBadgeStyle = (category: StopCategory) => {
  switch (category) {
    case 'Fuel':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        marker: 'bg-emerald-500 text-neutral-950',
        icon: Fuel,
      };
    case 'Rest Area':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        marker: 'bg-amber-500 text-neutral-950',
        icon: Coffee,
      };
    case 'Hotel':
      return {
        bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        marker: 'bg-sky-500 text-neutral-950',
        icon: Hotel,
      };
    case 'Parking':
    case 'Truck Stop':
      return {
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        marker: 'bg-purple-500 text-neutral-950',
        icon: SquareParking,
      };
    case 'Food':
      return {
        bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        marker: 'bg-orange-500 text-neutral-950',
        icon: Utensils,
      };
    case 'Maintenance':
      return {
        bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
        marker: 'bg-slate-400 text-neutral-950',
        icon: Wrench,
      };
    default:
      return {
        bg: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
        marker: 'bg-brand-500 text-neutral-950',
        icon: Truck,
      };
  }
};

export const StopCard: React.FC<StopCardProps> = ({
  stop,
  isActive = false,
  onSelect,
  onLockToggle,
  onEdit,
  onDelete,
}) => {
  const style = getCategoryBadgeStyle(stop.category);
  const CategoryIcon = style.icon;
  const rating = stop.metadata?.rating || 4.5;
  const fuelPrice = stop.metadata?.fuel_price;

  return (
    <div
      onClick={onSelect}
      className={`border rounded-xl p-4 transition-all cursor-pointer relative group ${
        isActive
          ? 'bg-neutral-800 border-brand-500 shadow-lg ring-1 ring-brand-500/50'
          : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Category & Info */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${style.bg}`}
          >
            <CategoryIcon className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-neutral-100 leading-snug">{stop.name}</h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bg}`}
              >
                {stop.category}
              </span>
              {stop.is_locked && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-700/60 text-neutral-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-400" /> Locked
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>Mile {stop.distance_from_start}</span>
              <span>•</span>
              <span>Duration: {stop.duration * 60} mins</span>
              {stop.arrival_time && (
                <>
                  <span>•</span>
                  <span>
                    ETA:{' '}
                    {new Date(stop.arrival_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Badges & Metadata */}
            <div className="flex items-center gap-3 pt-1 text-[11px]">
              <div className="flex items-center gap-1 text-amber-400 font-medium">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{rating.toFixed(1)}</span>
              </div>

              {stop.metadata?.truck_friendly && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Truck Friendly
                </span>
              )}

              {stop.metadata?.open_24h && (
                <span className="text-sky-400 font-medium">24/7 Open</span>
              )}

              {fuelPrice && fuelPrice > 0 && (
                <span className="text-neutral-300 font-semibold bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  ${fuelPrice}/gal
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
          {onLockToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLockToggle(stop.id, !stop.is_locked);
              }}
              title={stop.is_locked ? 'Unlock Stop' : 'Lock Stop'}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
            >
              {stop.is_locked ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(stop);
              }}
              title="Edit Stop Details"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-brand-400 hover:bg-neutral-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {onDelete && !stop.is_locked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(stop.id);
              }}
              title="Remove Optional Stop"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
