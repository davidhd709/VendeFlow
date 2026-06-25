import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID('4')
  assignedToId!: string;

  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
