import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const DB = Symbol('DB');
export type DrizzleDb = ReturnType<typeof drizzle>;

@Module({
  providers: [
    {
      provide: DB,
      useFactory: () => drizzle(postgres(process.env.DATABASE_URL!)),
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
