import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateDepartmentSwaggerDto {
  @ApiProperty({ example: 'Phòng Nhân sự', description: 'Tên phòng ban, phải duy nhất' })
  name!: string;

  @ApiPropertyOptional({ example: 'Quản lý tuyển dụng, đào tạo và phúc lợi nhân viên' })
  description?: string;
}

export class UpdateDepartmentSwaggerDto {
  @ApiPropertyOptional({ example: 'Phòng Nhân sự' })
  name?: string;

  @ApiPropertyOptional({ example: 'Quản lý tuyển dụng, đào tạo và phúc lợi nhân viên' })
  description?: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'ID của Employee làm trưởng phòng. Truyền null để gỡ trưởng phòng hiện tại.',
  })
  headEmployeeId?: string | null;
}
