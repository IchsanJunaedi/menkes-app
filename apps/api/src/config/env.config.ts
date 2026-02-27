import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
});

export default registerAs('app', () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables', parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
});
