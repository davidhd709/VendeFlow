/**
 * Schemas estrictos para el campo `data` de cada tipo de sección.
 *
 * Cada tipo tiene un DTO. La validación se hace con class-validator usando
 * whitelist + forbidNonWhitelisted (ver `validateSectionData`), por lo que
 * cualquier propiedad fuera del schema se rechaza. No se acepta HTML/CSS/JS:
 * todos los campos son strings simples con MaxLength.
 */
import { plainToInstance, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  validateOrReject,
  ValidateNested,
} from 'class-validator';
import { WebsiteSectionType } from '@prisma/client';
import { BusinessError } from '../../common/errors/business-error';

// ─── Helpers ─────────────────────────────────────────────────────────

export class CtaButtonDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  href?: string;
}

export class ContentItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;
}

export class FaqItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  question!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  answer!: string;
}

// ─── Shared Style ────────────────────────────────────────────────────

export class TextStyleDto {
  @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{3,8}$/) color?: string;
  @IsOptional() @IsString() @MaxLength(200) fontFamily?: string;
  @IsOptional() @IsString() @Matches(/^\d+(\.\d+)?(px|rem|em|pt)$/) fontSize?: string;
  @IsOptional() @IsString() @Matches(/^(bold|bolder|lighter|normal|[1-9]00)$/) fontWeight?: string;
  @IsOptional() @IsIn(['normal', 'italic']) fontStyle?: string;
  @IsOptional() @IsIn(['left', 'center', 'right', 'justify']) textAlign?: string;
  @IsOptional() @IsIn(['none', 'uppercase', 'lowercase', 'capitalize']) textTransform?: string;
  @IsOptional() @IsString() @Matches(/^-?\d+(\.\d+)?(em|px|rem)$/) letterSpacing?: string;
  @IsOptional() @IsString() @Matches(/^\d+(\.\d+)?(|px|rem|em)$/) lineHeight?: string;
}

export class ButtonStyleDto {
  @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{3,8}$/) bgColor?: string;
  @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{3,8}$/) textColor?: string;
  @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{3,8}$/) borderColor?: string;
  @IsOptional() @IsIn(['none', 'sm', 'md', 'lg', 'xl', 'full']) borderRadius?: string;
}

export class CardStyleDto {
  @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{3,8}$/) bgColor?: string;
  @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{3,8}$/) textColor?: string;
  @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{3,8}$/) borderColor?: string;
  @IsOptional() @IsIn(['none', 'sm', 'md', 'lg', 'xl', 'full']) borderRadius?: string;
  @IsOptional() @IsIn(['none', 'sm', 'md', 'lg']) shadow?: string;
}

export class ImageStyleDto {
  @IsOptional() @IsIn(['none', 'sm', 'md', 'lg', 'xl', 'full']) borderRadius?: string;
  @IsOptional() @IsIn(['1/1', '4/3', '3/2', '16/9', 'auto']) aspectRatio?: string;
}

export class SectionStyleDto {
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{3,8}$/, { message: 'bgColor debe ser un color hexadecimal válido' })
  bgColor?: string;

  @IsOptional() @IsIn(['sans', 'serif', 'display']) fontFamily?: string;
  @IsOptional() @IsIn(['none', 'xs', 'sm', 'md', 'lg', 'xl']) paddingY?: string;

  @IsOptional() @ValidateNested() @Type(() => TextStyleDto) title?: TextStyleDto;
  @IsOptional() @ValidateNested() @Type(() => TextStyleDto) subtitle?: TextStyleDto;
  @IsOptional() @ValidateNested() @Type(() => TextStyleDto) eyebrow?: TextStyleDto;
  @IsOptional() @ValidateNested() @Type(() => TextStyleDto) body?: TextStyleDto;

  @IsOptional() @ValidateNested() @Type(() => ButtonStyleDto) primaryBtn?: ButtonStyleDto;
  @IsOptional() @ValidateNested() @Type(() => ButtonStyleDto) secondaryBtn?: ButtonStyleDto;
  @IsOptional() @ValidateNested() @Type(() => CardStyleDto) card?: CardStyleDto;
  @IsOptional() @ValidateNested() @Type(() => ImageStyleDto) image?: ImageStyleDto;
}

// ─── Sections ────────────────────────────────────────────────────────

export class HeroDataDto {
  @IsOptional() @IsIn(['classic', 'centered', 'promo']) variant?: string;
  @IsOptional()
  @IsIn(['commercial', 'premium', 'vibrant', 'comercial', 'minimal', 'vibrante'])
  theme?: string;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(280) subtitle?: string;
  @IsOptional() @IsUrl({ require_protocol: false }) @MaxLength(500) imageUrl?: string;
  @IsOptional() @ValidateNested() @Type(() => CtaButtonDto) ctaPrimary?: CtaButtonDto;
  @IsOptional() @ValidateNested() @Type(() => CtaButtonDto) ctaSecondary?: CtaButtonDto;
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class FeaturedProductsDataDto {
  @IsOptional() @IsIn(['grid', 'highlight', 'compact']) variant?: string;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(220) subtitle?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) limit?: number;
  @IsOptional() @IsString() @MaxLength(40) ctaLabel?: string;
  @IsOptional() @IsBoolean() showCta?: boolean;
  @IsOptional() @IsString() @MaxLength(220) emptyMessage?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) productIds?: string[];
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class ServicesDataDto {
  @IsOptional() @IsIn(['grid', 'list', 'featured']) variant?: string;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  items?: ContentItemDto[];
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class BenefitsDataDto {
  @IsOptional() @IsIn(['grid', 'list', 'featured']) variant?: string;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  items?: ContentItemDto[];
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class OfficesDataDto {
  @IsOptional() @IsIn(['cards', 'compact', 'contact']) variant?: string;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(280) subtitle?: string;
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class FaqDataDto {
  @IsOptional() @IsIn(['accordion', 'list', 'twoColumns']) variant?: string;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  items?: FaqItemDto[];
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class CtaDataDto {
  @IsOptional() @IsIn(['centered', 'split', 'banner']) variant?: string;
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(280) subtitle?: string;
  @IsOptional() @ValidateNested() @Type(() => CtaButtonDto) ctaPrimary?: CtaButtonDto;
  @IsOptional() @ValidateNested() @Type(() => CtaButtonDto) ctaSecondary?: CtaButtonDto;
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class ContactDataDto {
  @IsOptional() @IsIn(['card', 'split', 'channels']) variant?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsBoolean() useCompanyContact?: boolean;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(120) email?: string;
  @IsOptional() @IsString() @MaxLength(280) address?: string;
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

export class FooterDataDto {
  @IsOptional() @IsIn(['simple', 'columns', 'compact']) variant?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() @MaxLength(120) copyrightText?: string;
  @IsOptional() @IsString() @MaxLength(30) whatsapp?: string;
  @IsOptional() @IsEmail() @MaxLength(120) email?: string;
  @IsOptional() @IsBoolean() showPoweredBySalesflow?: boolean;
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

class NavbarLinkDto {
  @IsString() @MaxLength(60) label!: string;
  @IsOptional() @IsString() @MaxLength(500) href?: string;
}

export class NavbarDataDto {
  @IsOptional() @IsIn(['simple', 'centered', 'split']) variant?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => NavbarLinkDto) links?: NavbarLinkDto[];
  @IsOptional() @IsString() @MaxLength(60) ctaLabel?: string;
  @IsOptional() @IsString() @MaxLength(500) ctaHref?: string;
  @IsOptional() @IsBoolean() showLogo?: boolean;
  @IsOptional() @ValidateNested() @Type(() => SectionStyleDto) style?: SectionStyleDto;
}

// ─── Registry + validador dinámico ───────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DtoClass = new (...args: any[]) => object;

const SECTION_DATA_CLASS: Record<WebsiteSectionType, DtoClass> = {
  NAVBAR: NavbarDataDto,
  HERO: HeroDataDto,
  FEATURED_PRODUCTS: FeaturedProductsDataDto,
  SERVICES: ServicesDataDto,
  BENEFITS: BenefitsDataDto,
  OFFICES: OfficesDataDto,
  FAQ: FaqDataDto,
  CTA: CtaDataDto,
  CONTACT: ContactDataDto,
  FOOTER: FooterDataDto,
};

/**
 * Valida y normaliza el payload `data` de una sección.
 * - Hace `plainToInstance` para descartar propiedades fuera del schema.
 * - Corre `validateOrReject` con `whitelist + forbidNonWhitelisted`.
 * - Devuelve el objeto plano serializable listo para guardar como JSON.
 *
 * Lanza `BusinessError(422)` con el primer error legible si la data no
 * cumple el schema.
 */
export async function validateSectionData(
  type: WebsiteSectionType,
  raw: unknown,
): Promise<Record<string, unknown>> {
  const cls = SECTION_DATA_CLASS[type];
  if (!cls) {
    throw new BusinessError(
      422,
      'Tipo de sección no soportado',
      'BUSINESS_RULE_VIOLATION',
      'type',
    );
  }

  const instance = plainToInstance(cls, raw ?? {}, {
    excludeExtraneousValues: false,
  });

  try {
    await validateOrReject(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false, // necesario para nested DTOs con class-transformer
    });
  } catch (errors) {
    const message = firstReadableError(errors) ?? 'Datos de sección inválidos';
    const field = firstFieldName(errors);
    throw new BusinessError(422, message, 'BUSINESS_RULE_VIOLATION', field);
  }

  // Re-instanciar para obtener un objeto plano "limpio" (sin __proto__ raros).
  return JSON.parse(JSON.stringify(instance));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstReadableError(errors: any): string | undefined {
  if (!Array.isArray(errors) || errors.length === 0) return undefined;
  const first = errors[0];
  if (first?.constraints && typeof first.constraints === 'object') {
    return Object.values(first.constraints)[0] as string;
  }
  if (first?.children?.length) return firstReadableError(first.children);
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstFieldName(errors: any): string | undefined {
  if (!Array.isArray(errors) || errors.length === 0) return undefined;
  return errors[0]?.property as string | undefined;
}
