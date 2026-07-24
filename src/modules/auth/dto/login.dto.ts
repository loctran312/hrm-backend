import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export class LoginSwaggerDto {
  @ApiProperty({ example: 'admin@hrm.local' })
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  password!: string;
}
