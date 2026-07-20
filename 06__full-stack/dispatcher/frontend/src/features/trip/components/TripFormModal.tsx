import React, { useState, useEffect } from 'react';
import { tripSchema, type TripFormData } from '../schemas/tripSchema';
import type { Trip } from '../types/trip';
import { X, Loader2, Navigation, Clock, FileText } from 'lucide-react';
import { LocationAutocomplete } from '@/features/location/components/LocationAutocomplete';

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TripFormData) => Promise<void>;
  initialData?: Trip | null;
  isLoading?: boolean;
}

export const TripFormModal: React.FC<TripFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<TripFormData>({
    current_location: '',
    current_location_name: '',
    current_lat: null,
    current_lng: null,

    pickup_location: '',
    pickup_name: '',
    pickup_lat: null,
    pickup_lng: null,

    dropoff_location: '',
    dropoff_name: '',
    dropoff_lat: null,
    dropoff_lng: null,

    current_cycle_used: 0,
    status: 'Draft',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        current_location: initialData.current_location_name || initialData.current_location,
        current_location_name: initialData.current_location_name || initialData.current_location,
        current_lat: initialData.current_lat ?? null,
        current_lng: initialData.current_lng ?? null,

        pickup_location: initialData.pickup_name || initialData.pickup_location,
        pickup_name: initialData.pickup_name || initialData.pickup_location,
        pickup_lat: initialData.pickup_lat ?? null,
        pickup_lng: initialData.pickup_lng ?? null,

        dropoff_location: initialData.dropoff_name || initialData.dropoff_location,
        dropoff_name: initialData.dropoff_name || initialData.dropoff_location,
        dropoff_lat: initialData.dropoff_lat ?? null,
        dropoff_lng: initialData.dropoff_lng ?? null,

        current_cycle_used: Number(initialData.current_cycle_used),
        status: initialData.status,
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        current_location: '',
        current_location_name: '',
        current_lat: null,
        current_lng: null,

        pickup_location: '',
        pickup_name: '',
        pickup_lat: null,
        pickup_lng: null,

        dropoff_location: '',
        dropoff_name: '',
        dropoff_lat: null,
        dropoff_lng: null,

        current_cycle_used: 0,
        status: 'Draft',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = tripSchema.safeParse(formData);
    if (!result.success) {
      const { fieldErrors } = result.error.flatten();
      const newErrors: Record<string, string> = {};
      if (fieldErrors.current_location?.[0]) newErrors.current_location = fieldErrors.current_location[0];
      if (fieldErrors.pickup_location?.[0]) newErrors.pickup_location = fieldErrors.pickup_location[0];
      if (fieldErrors.dropoff_location?.[0]) newErrors.dropoff_location = fieldErrors.dropoff_location[0];
      if (fieldErrors.current_cycle_used?.[0]) newErrors.current_cycle_used = fieldErrors.current_cycle_used[0];
      if (fieldErrors.status?.[0]) newErrors.status = fieldErrors.status[0];
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(result.data);
      onClose();
    } catch (err: any) {
      if (err.response?.data && typeof err.response.data === 'object') {
        const serverErrors: Record<string, string> = {};
        Object.entries(err.response.data).forEach(([key, val]) => {
          if (Array.isArray(val) && val.length > 0) {
            serverErrors[key] = val[0];
          }
        });
        setErrors(serverErrors);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Navigation className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              {initialData ? 'Edit Trip Record' : 'Create New Trip Record'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Current Location */}
          <LocationAutocomplete
            label="Current Location *"
            value={formData.current_location}
            lat={formData.current_lat ?? null}
            lng={formData.current_lng ?? null}
            placeholder="Search current location (e.g. Lahore)"
            error={errors.current_location}
            onChange={(loc) =>
              setFormData({
                ...formData,
                current_location: loc.name,
                current_location_name: loc.name,
                current_lat: loc.lat,
                current_lng: loc.lng,
              })
            }
            onClear={() =>
              setFormData({
                ...formData,
                current_location: '',
                current_location_name: '',
                current_lat: null,
                current_lng: null,
              })
            }
            showMapPreview={true}
            showCurrentLocation={true}
          />

          {/* Pickup & Dropoff Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LocationAutocomplete
              label="Pickup Location *"
              value={formData.pickup_location}
              lat={formData.pickup_lat ?? null}
              lng={formData.pickup_lng ?? null}
              placeholder="Search pickup location..."
              error={errors.pickup_location}
              onChange={(loc) =>
                setFormData({
                  ...formData,
                  pickup_location: loc.name,
                  pickup_name: loc.name,
                  pickup_lat: loc.lat,
                  pickup_lng: loc.lng,
                })
              }
              onClear={() =>
                setFormData({
                  ...formData,
                  pickup_location: '',
                  pickup_name: '',
                  pickup_lat: null,
                  pickup_lng: null,
                })
              }
              showMapPreview={true}
              showCurrentLocation={false}
            />

            <LocationAutocomplete
              label="Dropoff Location *"
              value={formData.dropoff_location}
              lat={formData.dropoff_lat ?? null}
              lng={formData.dropoff_lng ?? null}
              placeholder="Search dropoff location..."
              error={errors.dropoff_location}
              onChange={(loc) =>
                setFormData({
                  ...formData,
                  dropoff_location: loc.name,
                  dropoff_name: loc.name,
                  dropoff_lat: loc.lat,
                  dropoff_lng: loc.lng,
                })
              }
              onClear={() =>
                setFormData({
                  ...formData,
                  dropoff_location: '',
                  dropoff_name: '',
                  dropoff_lat: null,
                  dropoff_lng: null,
                })
              }
              showMapPreview={true}
              showCurrentLocation={false}
            />
          </div>

          {/* Cycle Hours & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Current Cycle Hours Used * (0 - 70 hrs)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="70"
                  value={formData.current_cycle_used}
                  onChange={(e) => setFormData({ ...formData, current_cycle_used: Number(e.target.value) })}
                  placeholder="e.g. 25"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
              {errors.current_cycle_used && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.current_cycle_used}</p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Planning">Planning</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {errors.status && <p className="text-rose-400 text-[11px] mt-1">{errors.status}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Add special instructions or cargo details..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {initialData ? 'Save Changes' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
