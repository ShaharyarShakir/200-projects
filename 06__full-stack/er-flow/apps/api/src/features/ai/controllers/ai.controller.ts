import { Controller, Post, Body, Res, HttpStatus } from "@nestjs/common";
import type { Response } from "express";
import { AiService } from "../services/ai.service.js";
import { RagService } from "../services/rag.service.js";
import { ChatDto, GenerateDiagramDto, IndexWorkspaceDto } from "../dto/chat.dto.js";

@Controller("ai")
export class AiController {
  constructor(
    private aiService: AiService,
    private ragService: RagService
  ) {}

  @Post("chat/stream")
  async streamChat(
    @Body() body: any, // Use any to support optional history array
    @Res() res: Response
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const generator = this.aiService.chatStream({
        message: body.message,
        history: body.history || [],
        workspaceId: body.workspaceId,
        documentId: body.documentId,
        diagramContext: body.diagramContext,
      });

      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }

  @Post("diagram/generate")
  async generateDiagram(@Body() body: GenerateDiagramDto) {
    try {
      const result = await this.aiService.generateDiagram(body.prompt, body.diagramContext);
      return { success: true, operations: result.operations };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to generate diagram operations" };
    }
  }

  @Post("schema/explain")
  async explainSchema(@Body("ast") ast: any) {
    try {
      const astJson = JSON.stringify(ast);
      const explanation = await this.aiService.explainSchema(astJson);
      return { success: true, explanation };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to explain schema" };
    }
  }

  @Post("workspace/index")
  async indexWorkspace(@Body() body: IndexWorkspaceDto) {
    try {
      const result = await this.ragService.indexWorkspace(body.workspaceId);
      return { success: true, indexedCount: result.documentsCount };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to index workspace" };
    }
  }
}
