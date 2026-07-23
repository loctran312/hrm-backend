import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken không được để trống'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
