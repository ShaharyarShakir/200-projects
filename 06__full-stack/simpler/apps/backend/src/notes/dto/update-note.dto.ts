import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string | null;

  @IsBoolean()
  @IsOptional()
  favorite?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
