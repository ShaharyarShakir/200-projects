import { Module } from "@nestjs/common";
import { FolderController } from "./controllers/folder.controller.js";
import { FolderService } from "./services/folder.service.js";
import { FolderRepository } from "./repositories/folder.repository.js";
import { DatabaseModule } from "../../database/database.module.js";

@Module({
  imports: [DatabaseModule],
  controllers: [FolderController],
  providers: [
    FolderService,
    FolderRepository,
  ],
  exports: [FolderService, FolderRepository],
})
export class FoldersModule {}
