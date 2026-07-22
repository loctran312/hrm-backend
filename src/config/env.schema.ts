import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL phải là một URL hợp lệ' }),

  // JWT Access Token
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET phải có ít nhất 32 ký tự'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

  // JWT Refresh Token
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET phải có ít nhất 32 ký tự'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Swagger
  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),
});

export type EnvSchema = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown>): EnvSchema {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `❌ Biến môi trường không hợp lệ:\n${formattedErrors}\n\nVui lòng kiểm tra file .env (tham khảo .env.example).`,
    );
  }

  return result.data;
}
