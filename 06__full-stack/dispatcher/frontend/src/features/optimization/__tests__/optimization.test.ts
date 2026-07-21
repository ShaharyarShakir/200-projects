import { describe, it, expect } from 'vitest';
import { getCategoryBadgeStyle } from '../components/StopCard';
import type { Stop } from '../types/optimization';

describe('Optimization Feature Tests', () => {
  it('returns correct badge style for categories', () => {
    const fuelStyle = getCategoryBadgeStyle('Fuel');
    expect(fuelStyle.bg).toContain('emerald');

    const restStyle = getCategoryBadgeStyle('Rest Area');
    expect(restStyle.bg).toContain('amber');

    const hotelStyle = getCategoryBadgeStyle('Hotel');
    expect(hotelStyle.bg).toContain('sky');
  });

  it('correctly structures stop object', () => {
    const mockStop: Stop = {
      id: 'stop-1',
      name: 'Pilot Flying J',
      category: 'Fuel',
      latitude: 32.7767,
      longitude: -96.7970,
      distance_from_start: 150.0,
      arrival_time: '2026-07-21T14:20:00Z',
      departure_time: '2026-07-21T14:45:00Z',
      duration: 0.5,
      priority: 95,
      source: 'OpenStreetMap',
      is_locked: false,
      is_custom: false,
      order: 1,
      metadata: {
        truck_friendly: true,
        open_24h: true,
        fuel_price: 3.85,
      },
    };

    expect(mockStop.name).toBe('Pilot Flying J');
    expect(mockStop.category).toBe('Fuel');
    expect(mockStop.metadata.truck_friendly).toBe(true);
  });
});
