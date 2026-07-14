import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { FolderService } from "../services/folder.service.js";
import { AuthGuard } from "../../../auth/auth.guard.js";
import { IsString, IsOptional, IsNumber } from "class-validator";

class CreateFolderDto {
  @IsString()
  name: string;

  @IsString()
  workspaceId: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

class UpdateFolderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

@Controller("folders")
@UseGuards(AuthGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  async create(@Body() dto: CreateFolderDto) {
    return this.folderService.create(
      dto.name,
      dto.workspaceId,
      dto.parentId,
      dto.icon,
      dto.order
    );
  }

  @Get()
  async list(@Query("workspaceId") workspaceId: string) {
    return this.folderService.list(workspaceId);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateFolderDto) {
    return this.folderService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string) {
    await this.folderService.delete(id);
  }
}
