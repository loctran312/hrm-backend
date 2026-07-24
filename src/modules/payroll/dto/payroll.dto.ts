import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const calculatePayrollSchema = z.object({
  employeeId: z.string().min(1, 'employeeId không được để trống'),
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2000),
  totalAllowance: z.coerce.number().min(0).default(0),
  totalDeduction: z.coerce.number().min(0).default(0),
});

export type CalculatePayrollDto = z.infer<typeof calculatePayrollSchema>;

export class CalculatePayrollSwaggerDto {
  @ApiProperty({ example: 'clx3m2n1o0000ttgjkl789mno', description: 'ID nhân viên (GET /employees)' })
  employeeId!: string;

  @ApiProperty({ example: 8, minimum: 1, maximum: 12, description: 'Tháng tính lương (1-12)' })
  periodMonth!: number;

  @ApiProperty({ example: 2026, minimum: 2000, description: 'Năm tính lương' })
  periodYear!: number;

  @ApiPropertyOptional({ example: 1000000, default: 0, description: 'Tổng phụ cấp (VND)' })
  totalAllowance?: number;

  @ApiPropertyOptional({ example: 200000, default: 0, description: 'Tổng khấu trừ (VND)' })
  totalDeduction?: number;
}
