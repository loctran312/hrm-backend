import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const checkInSchema = z.object({
  note: z.string().optional(),
});

export type CheckInDto = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  note: z.string().optional(),
});

export type CheckOutDto = z.infer<typeof checkOutSchema>;

export class CheckInSwaggerDto {
  @ApiPropertyOptional({ example: 'Đi làm bằng xe máy, kẹt xe nhẹ' })
  note?: string;
}

export class CheckOutSwaggerDto {
  @ApiPropertyOptional({ example: 'Hoàn thành công việc trong ngày' })
  note?: string;
}
