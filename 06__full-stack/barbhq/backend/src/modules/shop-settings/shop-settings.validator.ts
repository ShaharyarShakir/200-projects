import { z } from 'zod';

export const updateShopSettingsSchema = z.object({
  bookingEnabled: z.boolean().optional(),
  onlineBookingEnabled: z.boolean().optional(),
  allowWalkIns: z.boolean().optional(),
  requireCustomerPhone: z.boolean().optional(),
  allowCustomerCancellation: z.boolean().optional(),
  cancellationWindowMinutes: z.number().min(0).optional(),
  defaultAppointmentDuration: z.number().min(5).optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  receiptEnabled: z.boolean().optional(),
});
