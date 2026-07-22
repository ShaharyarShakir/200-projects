import React, { useState, useEffect } from 'react';
import type { Stop, StopCategory } from '../types/optimization';
import { X, Save, Lock, Unlock } from 'lucide-react';

interface InteractiveStopEditorProps {
  isOpen: boolean;
  stop?: Stop | null;
  onSave: (stopData: Partial<Stop>) => void;
  onClose: () => void;
}

export const InteractiveStopEditor: React.FC<InteractiveStopEditorProps> = ({
  isOpen,
  stop,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<StopCategory>('Truck Stop');
  const [distanceFromStart, setDistanceFromStart] = useState<number>(100);
  const [durationHours, setDurationHours] = useState<number>(0.5);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (stop) {
      setName(stop.name);
      setCategory(stop.category);
      setDistanceFromStart(stop.distance_from_start);
      setDurationHours(stop.duration);
      setIsLocked(stop.is_locked);
      setNotes(stop.metadata?.notes || '');
    } else {
      setName('');
      setCategory('Fuel');
      setDistanceFromStart(150);
      setDurationHours(0.5);
      setIsLocked(false);
      setNotes('');
    }
  }, [stop, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(stop ? { id: stop.id } : {}),
      name: name || 'Custom Waypoint',
      category,
      distance_from_start: distanceFromStart,
      duration: durationHours,
      is_locked: isLocked,
      is_custom: !stop,
      metadata: {
        ...(stop?.metadata || {}),
        notes,
      },
    });
    onClose();
  };

  const categories: StopCategory[] = [
    'Fuel',
    'Truck Stop',
    'Rest Area',
    'Parking',
    'Hotel',
    'Food',
    'Maintenance',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            {stop ? 'Edit Stop Details' : 'Add Custom Waypoint Stop'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Stop Name / Location</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Love's Travel Stop #402"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StopCategory)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 focus:border-brand-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-neutral-900 text-neutral-100">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Duration (Hours)</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="34"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Distance from Start (Miles)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={distanceFromStart}
              onChange={(e) => setDistanceFromStart(Number(e.target.value))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-semibold mb-1">Driver Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add optional notes (e.g. DEF pump available, shower reserved)..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-neutral-100 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                isLocked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {isLocked ? 'Locked (Protected from re-optimization)' : 'Unlocked'}
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold cursor-pointer shadow-lg shadow-brand-600/30"
            >
              <Save className="w-4 h-4" /> Save Stop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
