import { z } from 'zod';

export const calculatePayrollSchema = z.object({
  employeeId: z.string().min(1, 'employeeId không được để trống'),
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2000),
  totalAllowance: z.coerce.number().min(0).default(0),
  totalDeduction: z.coerce.number().min(0).default(0),
});

export type CalculatePayrollDto = z.infer<typeof calculatePayrollSchema>;
