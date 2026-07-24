import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const createPositionSchema = z.object({
  title: z.string().min(1, 'Tên chức danh không được để trống'),
  departmentId: z.string().min(1, 'departmentId không được để trống'),
  description: z.string().optional(),
});

export type CreatePositionDto = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = createPositionSchema.partial();

export type UpdatePositionDto = z.infer<typeof updatePositionSchema>;

export class CreatePositionSwaggerDto {
  @ApiProperty({ example: 'Senior Backend Engineer' })
  title!: string;

  @ApiProperty({ example: 'clx1a2b3c0000ttgxyz123abc', description: 'ID của Department chứa chức danh này' })
  departmentId!: string;

  @ApiPropertyOptional({ example: 'Chịu trách nhiệm thiết kế và xây dựng hệ thống backend' })
  description?: string;
}

export class UpdatePositionSwaggerDto {
  @ApiPropertyOptional({ example: 'Senior Backend Engineer' })
  title?: string;

  @ApiPropertyOptional({ example: 'clx1a2b3c0000ttgxyz123abc' })
  departmentId?: string;

  @ApiPropertyOptional({ example: 'Chịu trách nhiệm thiết kế và xây dựng hệ thống backend' })
  description?: string;
}
