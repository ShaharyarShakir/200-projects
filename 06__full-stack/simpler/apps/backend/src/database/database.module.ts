import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DB = Symbol('DB');
export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

@Module({
  providers: [
    {
      provide: DB,
      useFactory: () =>
        drizzle(postgres(process.env.DATABASE_URL!), { schema }),
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
