import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Tên phòng ban không được để trống'),
  description: z.string().optional(),
});

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  headEmployeeId: z.string().nullable().optional(),
});

export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
