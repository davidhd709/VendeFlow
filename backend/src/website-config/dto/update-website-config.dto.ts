import {
  IsArray,
  IsEmail,
  IsHexColor,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateWebsiteConfigDto {
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  // Cada elemento: { imageUrl, link?, alt? }
  @IsOptional()
  @IsArray()
  banners?: unknown[];

  // Cada elemento: { title, description?, icon? }
  @IsOptional()
  @IsArray()
  services?: unknown[];

  // Cada elemento: { question, answer }
  @IsOptional()
  @IsArray()
  faq?: unknown[];

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
