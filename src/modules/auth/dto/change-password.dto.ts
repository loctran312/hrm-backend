import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu cũ không được để trống'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export class ChangePasswordSwaggerDto {
  @ApiProperty({ example: 'ChangeMe123!' })
  oldPassword!: string;

  @ApiProperty({ example: 'NewStrongPassword456!', minLength: 8 })
  newPassword!: string;
}
