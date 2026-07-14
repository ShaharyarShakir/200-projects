import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { DocumentService } from "../services/document.service.js";
import { AuthGuard } from "../../../auth/auth.guard.js";
import { IsString, IsOptional, IsEnum } from "class-validator";

class CreateDocumentDto {
  @IsString()
  title: string;

  @IsString()
  workspaceId: string;

  @IsString()
  @IsOptional()
  folderId?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}

class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsString()
  @IsOptional()
  folderId?: string;

  @IsEnum(["workspace", "private", "public"])
  @IsOptional()
  visibility?: "workspace" | "private" | "public";
}

@Controller("documents")
@UseGuards(AuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateDocumentDto) {
    return this.documentService.create(
      dto.title,
      dto.workspaceId,
      dto.folderId,
      dto.icon,
      req.user.id
    );
  }

  @Get()
  async list(
    @Query("workspaceId") workspaceId: string,
    @Query("folderId") folderId?: string
  ) {
    return this.documentService.list(workspaceId, folderId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.documentService.findOne(id);
  }

  @Patch(":id")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto
  ) {
    return this.documentService.update(id, dto, req.user.id);
  }

  @Patch(":id/archive")
  async archive(@Req() req: any, @Param("id") id: string) {
    return this.documentService.archive(id, req.user.id);
  }

  @Patch(":id/restore")
  async restore(@Req() req: any, @Param("id") id: string) {
    return this.documentService.restore(id, req.user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string) {
    await this.documentService.delete(id);
  }

  // Snapshots
  @Post(":id/snapshots")
  async createSnapshot(@Req() req: any, @Param("id") id: string) {
    return this.documentService.createSnapshot(id, req.user.id);
  }

  @Get(":id/snapshots")
  async listSnapshots(@Param("id") id: string) {
    return this.documentService.listSnapshots(id);
  }

  @Post(":id/snapshots/:snapshotId/restore")
  async restoreSnapshot(
    @Req() req: any,
    @Param("id") id: string,
    @Param("snapshotId") snapshotId: string
  ) {
    return this.documentService.restoreSnapshot(id, snapshotId, req.user.id);
  }
}
