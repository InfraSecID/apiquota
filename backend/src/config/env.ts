import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .min(32, 'ENCRYPTION_MASTER_KEY must be at least 32 characters long or a 64-char hex string')
    .refine((key) => {
      // Must be either 64-char hex string or 32-byte string
      if (/^[0-9a-fA-F]{64}$/.test(key)) return true;
      return Buffer.from(key, 'utf8').length === 32;
    }, 'ENCRYPTION_MASTER_KEY must represent exactly 32 bytes (either 64-char hex or 32 raw UTF-8 bytes)'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  POLL_CRON_SCHEDULE: z.string().default('*/15 * * * *'),
  DEFAULT_ALERT_THRESHOLD: z.string().default('20.0').transform(Number),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_URL: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ FATAL: Invalid environment variables detected at startup:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
