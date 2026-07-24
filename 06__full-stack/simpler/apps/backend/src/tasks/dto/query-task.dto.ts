import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTaskDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE'])
  @IsOptional()
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';

  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'dueDate' | 'priority' = 'createdAt';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
