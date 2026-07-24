import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export class RegisterSwaggerDto {
  @ApiProperty({ example: 'hr@company.com', description: 'Email đăng nhập, phải là duy nhất' })
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8, description: 'Tối thiểu 8 ký tự' })
  password!: string;
}
