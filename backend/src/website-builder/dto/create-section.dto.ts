import { IsBoolean, IsEnum, IsObject, IsOptional } from 'class-validator';
import { WebsiteSectionType } from '@prisma/client';

export class CreateSectionDto {
  @IsEnum(WebsiteSectionType)
  type!: WebsiteSectionType;

  /** Si no se envía, el service inicializa con defaults del tipo. */
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}
