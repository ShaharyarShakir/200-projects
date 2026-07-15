import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './features/documents/documents.module.js';
import { FoldersModule } from './features/folders/folders.module.js';
import { SchemaModule } from './features/schema/schema.module.js';
import { AiModule } from './features/ai/ai.module.js';
import { json, urlencoded } from 'express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    DocumentsModule,
    FoldersModule,
    SchemaModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(json(), urlencoded({ extended: true }))
      .exclude(
        { path: 'api/auth', method: RequestMethod.ALL },
        { path: 'api/auth/(.*)', method: RequestMethod.ALL }
      )
      .forRoutes('*');
  }
}