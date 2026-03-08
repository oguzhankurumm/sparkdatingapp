import type { Config } from 'drizzle-kit'

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://spark:spark_local_123@localhost:5432/spark_dev',
  },
} satisfies Config
