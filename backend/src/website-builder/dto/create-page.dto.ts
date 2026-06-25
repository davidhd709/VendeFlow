import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreatePageDto {
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug inválido (minúsculas, números y guiones)',
  })
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;
}
