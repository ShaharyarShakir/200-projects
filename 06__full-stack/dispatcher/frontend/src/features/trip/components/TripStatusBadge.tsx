import React from 'react';
import type { TripStatus } from '../types/trip';

interface TripStatusBadgeProps {
  status: TripStatus;
}

export const TripStatusBadge: React.FC<TripStatusBadgeProps> = ({ status }) => {
  const styles: Record<TripStatus, string> = {
    Draft: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    Planning: 'bg-brand-50 text-brand-600 border-brand-300',
    Completed: 'bg-success-50 text-success-600 border-success-300',
    Cancelled: 'bg-error-50 text-error-600 border-error-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || styles.Draft
      }`}
    >
      {status}
    </span>
  );
};
