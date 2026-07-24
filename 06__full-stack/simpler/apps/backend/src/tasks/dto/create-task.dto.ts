import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE'])
  @IsOptional()
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
