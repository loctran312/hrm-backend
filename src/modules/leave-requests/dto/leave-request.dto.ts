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
