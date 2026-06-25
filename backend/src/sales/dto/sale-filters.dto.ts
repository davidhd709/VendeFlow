import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SaleFiltersDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID('4')
  sellerId?: string;

  @IsOptional()
  @IsUUID('4')
  officeId?: string;
}
