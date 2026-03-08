import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const DATABASE = Symbol('DATABASE')
export type Database = PostgresJsDatabase<typeof schema>

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const client = postgres(config.getOrThrow<string>('DATABASE_URL'))
        return drizzle(client, { schema })
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
