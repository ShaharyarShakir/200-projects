import { z } from 'zod';

export const startCountSchema = z.object({
  categoryIds: z.array(z.string()).optional(),
});

const countItemEntrySchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory Item ID is required'),
  countedQuantity: z.number().min(0, 'Counted quantity cannot be negative'),
  reason: z.string().optional(),
});

export const submitCountItemsSchema = z.object({
  items: z.array(countItemEntrySchema).min(1, 'At least one count item is required'),
});

export type StartCountDto = z.infer<typeof startCountSchema>;
export type SubmitCountItemsDto = z.infer<typeof submitCountItemsSchema>;
