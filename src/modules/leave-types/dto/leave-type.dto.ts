import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại nghỉ phép không được để trống'),
  maxDaysPerYear: z.coerce.number().int().positive().optional(),
  isPaid: z.boolean().default(true),
});

export type CreateLeaveTypeDto = z.infer<typeof createLeaveTypeSchema>;

export class CreateLeaveTypeSwaggerDto {
  @ApiProperty({ example: 'Nghỉ phép năm' })
  name!: string;

  @ApiPropertyOptional({ example: 12, description: 'Số ngày tối đa được nghỉ mỗi năm (bỏ trống = không giới hạn)' })
  maxDaysPerYear?: number;

  @ApiPropertyOptional({ example: true, default: true, description: 'Có được trả lương trong thời gian nghỉ hay không' })
  isPaid?: boolean;
}
