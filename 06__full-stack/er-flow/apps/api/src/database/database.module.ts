import { Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { UserRepository, WorkspaceRepository } from "@eraser/database";

@Module({
  providers: [
    DatabaseService,
    {
      provide: UserRepository,
      useFactory: () => new UserRepository(),
    },
    {
      provide: WorkspaceRepository,
      useFactory: () => new WorkspaceRepository(),
    },
  ],
  exports: [DatabaseService, UserRepository, WorkspaceRepository],
})
export class DatabaseModule {}
