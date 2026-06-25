import { IsBoolean, IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
