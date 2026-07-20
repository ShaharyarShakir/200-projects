import { z } from 'zod';

export const tripSchema = z.object({
  current_location: z.string().min(2, 'Current location must be at least 2 characters'),
  current_location_name: z.string().optional(),
  current_lat: z.number().nullable().optional(),
  current_lng: z.number().nullable().optional(),

  pickup_location: z.string().min(2, 'Pickup location must be at least 2 characters'),
  pickup_name: z.string().optional(),
  pickup_lat: z.number().nullable().optional(),
  pickup_lng: z.number().nullable().optional(),

  dropoff_location: z.string().min(2, 'Dropoff location must be at least 2 characters'),
  dropoff_name: z.string().optional(),
  dropoff_lat: z.number().nullable().optional(),
  dropoff_lng: z.number().nullable().optional(),

  current_cycle_used: z.coerce
    .number()
    .min(0, 'Current cycle hours cannot be negative')
    .max(70, 'Current cycle hours cannot exceed 70'),
  status: z.enum(['Draft', 'Planning', 'Completed', 'Cancelled']).default('Draft'),
  notes: z.string().optional(),
}).refine(
  (data) => data.current_lat !== null && data.current_lat !== undefined && data.current_lng !== null && data.current_lng !== undefined,
  {
    message: 'Please select a valid location from the search suggestions',
    path: ['current_location'],
  }
).refine(
  (data) => data.pickup_lat !== null && data.pickup_lat !== undefined && data.pickup_lng !== null && data.pickup_lng !== undefined,
  {
    message: 'Please select a valid location from the search suggestions',
    path: ['pickup_location'],
  }
).refine(
  (data) => data.dropoff_lat !== null && data.dropoff_lat !== undefined && data.dropoff_lng !== null && data.dropoff_lng !== undefined,
  {
    message: 'Please select a valid location from the search suggestions',
    path: ['dropoff_location'],
  }
);

export type TripFormData = z.infer<typeof tripSchema>;

