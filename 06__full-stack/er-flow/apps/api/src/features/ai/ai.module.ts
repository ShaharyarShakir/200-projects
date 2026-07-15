import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiController } from "./controllers/ai.controller.js";
import { AiService } from "./services/ai.service.js";
import { RagService } from "./services/rag.service.js";

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService, RagService],
  exports: [AiService, RagService],
})
export class AiModule {}
