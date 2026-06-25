import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class TaskFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
