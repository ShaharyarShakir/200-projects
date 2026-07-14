import { Module } from "@nestjs/common";
import { DocumentController } from "./controllers/document.controller.js";
import { DocumentService } from "./services/document.service.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { DatabaseModule } from "../../database/database.module.js";

@Module({
  imports: [DatabaseModule],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    DocumentRepository,
  ],
  exports: [DocumentService, DocumentRepository],
})
export class DocumentsModule {}
