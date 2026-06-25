import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // El servicio valida que solo sea COORDINADOR o VENDEDOR.
  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsUUID('4')
  officeId?: string;
}
