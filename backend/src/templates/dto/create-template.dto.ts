import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  body!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
