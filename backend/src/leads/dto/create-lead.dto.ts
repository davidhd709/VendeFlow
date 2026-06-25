import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'Pasaporte', 'TI', 'Otro'] as const;

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @Matches(/^\+?[\d\s\-()]{6,20}$/, { message: 'Teléfono inválido (6–15 dígitos, puede incluir espacios o guiones)' })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID('4')
  officeId?: string;

  /** Solo ADMIN puede asignar; el VENDEDOR siempre se asigna a sí mismo. */
  @IsOptional()
  @IsUUID('4')
  sellerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIn(DOCUMENT_TYPES)
  documentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  activationDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];
}
