import { z } from 'zod';

export const checkInSchema = z.object({
  note: z.string().optional(),
});

export type CheckInDto = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  note: z.string().optional(),
});

export type CheckOutDto = z.infer<typeof checkOutSchema>;
