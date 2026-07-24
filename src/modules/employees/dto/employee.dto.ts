import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateEmployeeSwaggerDto {
  @ApiProperty({ example: 'EMP-0042', description: 'Mã nhân viên, phải duy nhất' })
  employeeCode!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  fullName!: string;

  @ApiProperty({ example: '2026-08-01', description: 'Ngày vào làm (YYYY-MM-DD)' })
  hireDate!: string;

  @ApiProperty({ example: 15000000, description: 'Lương cơ bản (VND), phải > 0' })
  basicSalary!: number;

  @ApiProperty({ example: 'clx1a2b3c0000ttgxyz123abc', description: 'ID phòng ban (GET /departments)' })
  departmentId!: string;

  @ApiProperty({ example: 'clx9z8y7x0000ttgabc987xyz', description: 'ID chức danh (GET /positions)' })
  positionId!: string;

  @ApiPropertyOptional({ example: '1995-03-20', description: 'Ngày sinh (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'], example: 'MALE' })
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional({ example: '0901234567' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ, Quận 1, TP.HCM' })
  address?: string;

  @ApiPropertyOptional({ example: null, description: 'ID của Employee quản lý trực tiếp (nếu có)' })
  managerId?: string;

  @ApiPropertyOptional({
    example: null,
    description: 'ID tài khoản User để gắn quyền đăng nhập (nếu nhân viên đã có tài khoản)',
  })
  userId?: string;
}

export class UpdateEmployeeSwaggerDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  fullName?: string;

  @ApiPropertyOptional({ example: 16000000, description: 'Lương cơ bản mới (VND)' })
  basicSalary?: number;

  @ApiPropertyOptional({ example: 'clx1a2b3c0000ttgxyz123abc' })
  departmentId?: string;

  @ApiPropertyOptional({ example: 'clx9z8y7x0000ttgabc987xyz' })
  positionId?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ, Quận 1, TP.HCM' })
  address?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'TERMINATED'], example: 'SUSPENDED' })
  status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Ngày nghỉ việc (YYYY-MM-DD), chỉ set khi status = TERMINATED' })
  terminationDate?: string;
}
