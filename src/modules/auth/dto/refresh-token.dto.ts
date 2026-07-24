import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken không được để trống'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export class RefreshTokenSwaggerDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token nhận được lúc login hoặc lần refresh trước đó',
  })
  refreshToken!: string;
}
