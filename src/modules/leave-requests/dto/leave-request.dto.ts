import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.string().min(1, 'leaveTypeId không được để trống'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'endDate phải >= startDate',
    path: ['endDate'],
  });

export type CreateLeaveRequestDto = z.infer<typeof createLeaveRequestSchema>;

export const rejectLeaveRequestSchema = z.object({
  rejectionReason: z.string().min(1, 'Vui lòng nhập lý do từ chối'),
});

export type RejectLeaveRequestDto = z.infer<typeof rejectLeaveRequestSchema>;

export const leaveRequestStatusFilterSchema = z
  .enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
  .optional();

export class CreateLeaveRequestSwaggerDto {
  @ApiProperty({ example: 'clx7q6r5s0000ttgdef456ghi', description: 'ID loại nghỉ phép (GET /leave-types)' })
  leaveTypeId!: string;

  @ApiProperty({ example: '2026-08-10', description: 'Ngày bắt đầu nghỉ (YYYY-MM-DD)' })
  startDate!: string;

  @ApiProperty({ example: '2026-08-12', description: 'Ngày kết thúc nghỉ (YYYY-MM-DD), phải >= startDate' })
  endDate!: string;

  @ApiProperty({ required: false, example: 'Về quê thăm gia đình' })
  reason?: string;
}

export class RejectLeaveRequestSwaggerDto {
  @ApiProperty({ example: 'Trùng lịch với dự án đang gấp, vui lòng dời sang tuần sau' })
  rejectionReason!: string;
}
