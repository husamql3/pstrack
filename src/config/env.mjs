import { z } from 'zod'
import { createEnv } from '@t3-oss/env-nextjs'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
    NEXT_PUBLIC_SITE_URL: z.string(),
    NEXT_PUBLIC_AUTH_CALLBACK_URL: z.string(),
  },
  server: {
    DATABASE_URL: z.string(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    UPSTASH_REDIS_REST_URL: z.string().url().min(20),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(20),
    ADMIN_EMAIL: z.string().email(),
    EMAIL_USER: z.string().email(),
    EMAIL_PASSWORD: z.string(),
    API_SECRET: z.string().min(20),
    RABBITMQ_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_AUTH_CALLBACK_URL: process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL,
    API_KEY: process.env.API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    API_SECRET: process.env.API_SECRET,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
  },
  skipValidation: process.env.NODE_ENV !== 'development',
})
