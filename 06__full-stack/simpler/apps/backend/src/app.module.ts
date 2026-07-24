import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [HealthModule, AuthModule, TasksModule, NotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
