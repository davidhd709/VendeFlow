import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ImportLeadRowDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentNumber?: string;

  /** Nombre de la oficina — el servicio lo resuelve a officeId por empresa. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  officeName?: string;

  /** ISO 8601 o cualquier string parseable como fecha. */
  @IsOptional()
  @IsString()
  activationDate?: string;

  /** Nombre del vendedor en el Excel; el servicio lo resuelve a sellerId. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sellerName?: string;

  /** Hoja de origen: 'planes' | 'reposiciones' | 'excel'. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  source?: string;
}

export class ImportLeadsDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ImportLeadRowDto)
  rows!: ImportLeadRowDto[];
}
