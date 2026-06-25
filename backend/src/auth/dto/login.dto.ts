import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** Subdominio de la empresa. Ausente para SUPERADMIN. */
  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsString()
  @MinLength(2)
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
