import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CompanyStatus } from '@prisma/client';

export class CompanyAdminDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug inválido (minúsculas, números y guiones)',
  })
  slug!: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'subdominio inválido (minúsculas, números y guiones)',
  })
  subdomain!: string;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  /** ADMIN inicial de la empresa (sin él nadie podría iniciar sesión). */
  @ValidateNested()
  @Type(() => CompanyAdminDto)
  admin!: CompanyAdminDto;
}
