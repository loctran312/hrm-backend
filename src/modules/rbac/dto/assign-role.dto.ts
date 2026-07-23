import { z } from 'zod';

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, 'roleId không được để trống'),
});

export type AssignRoleDto = z.infer<typeof assignRoleSchema>;
