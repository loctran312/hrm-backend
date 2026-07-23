import { z } from 'zod';

export const createPositionSchema = z.object({
  title: z.string().min(1, 'Tên chức danh không được để trống'),
  departmentId: z.string().min(1, 'departmentId không được để trống'),
  description: z.string().optional(),
});

export type CreatePositionDto = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = createPositionSchema.partial();

export type UpdatePositionDto = z.infer<typeof updatePositionSchema>;
