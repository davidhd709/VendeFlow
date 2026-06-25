import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsUUID('4')
  templateId?: string;

  @IsOptional()
  @IsString()
  message?: string;

  // El máximo de 10 se valida en el servicio (regla de negocio → 422).
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  recipientLeadIds!: string[];
}
