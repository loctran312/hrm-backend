import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại nghỉ phép không được để trống'),
  maxDaysPerYear: z.coerce.number().int().positive().optional(),
  isPaid: z.boolean().default(true),
});

export type CreateLeaveTypeDto = z.infer<typeof createLeaveTypeSchema>;
