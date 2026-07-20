import { useState, useEffect } from 'react';
import type { LocationItem } from '../types/location';


const STORAGE_KEY = 'dispatcher_location_history';
const MAX_HISTORY = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<LocationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save location search history:', err);
    }
  }, [history]);

  const addToHistory = (item: LocationItem) => {
    setHistory((prev) => {
      // Remove duplicate place_id or display_name
      const filtered = prev.filter(
        (h) => h.place_id !== item.place_id && h.display_name !== item.display_name
      );
      return [item, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return {
    history,
    addToHistory,
    clearHistory,
  };
};
