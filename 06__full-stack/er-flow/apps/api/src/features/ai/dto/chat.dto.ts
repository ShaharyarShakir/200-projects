import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsOptional()
  documentId?: string;

  @IsString()
  @IsOptional()
  diagramContext?: string;
}

export class GenerateDiagramDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsOptional()
  diagramContext?: string;
}

export class IndexWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}
