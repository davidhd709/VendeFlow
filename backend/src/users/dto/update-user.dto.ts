import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// username no se cambia por esta vía (afecta login/credenciales).
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['username'] as const),
) {}
