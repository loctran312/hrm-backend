import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên không được để trống'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  hireDate: z.coerce.date(),
  basicSalary: z.coerce.number().positive('Lương cơ bản phải lớn hơn 0'),
  departmentId: z.string().min(1, 'departmentId không được để trống'),
  positionId: z.string().min(1, 'positionId không được để trống'),
  managerId: z.string().optional(),
  userId: z.string().optional(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']).optional(),
  terminationDate: z.coerce.date().optional(),
});

export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
