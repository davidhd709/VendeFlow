import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

/** Lead enviado desde la web pública. companyId se deriva del subdominio en el servidor. */
export class CreatePublicLeadDto {
  @IsString()
  subdomain!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Teléfono inválido (7–15 dígitos)' })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsUUID('4')
  officeId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];
}
