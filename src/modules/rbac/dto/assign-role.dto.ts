import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const assignRoleSchema = z.object({
  roleId: z.string().min(1, 'roleId không được để trống'),
});

export type AssignRoleDto = z.infer<typeof assignRoleSchema>;

export class AssignRoleSwaggerDto {
  @ApiProperty({ example: 'clx1a2b3c0000ttgxyz123abc', description: 'ID của Role (lấy từ GET /rbac/roles)' })
  roleId!: string;
}
