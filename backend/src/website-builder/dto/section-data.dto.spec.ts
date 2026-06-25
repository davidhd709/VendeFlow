import 'reflect-metadata';
import { WebsiteSectionType } from '@prisma/client';
import { validateSectionData } from './section-data.dto';

const validVariantByType: Record<WebsiteSectionType, string> = {
  NAVBAR: 'simple',
  HERO: 'classic',
  SERVICES: 'grid',
  BENEFITS: 'featured',
  FEATURED_PRODUCTS: 'highlight',
  OFFICES: 'cards',
  FAQ: 'twoColumns',
  CTA: 'banner',
  CONTACT: 'channels',
  FOOTER: 'columns',
};

describe('section-data dto validation', () => {
  it.each(Object.entries(validVariantByType))(
    'acepta variante válida para %s',
    async (type, variant) => {
      const data = await validateSectionData(type as WebsiteSectionType, { variant });
      expect(data).toMatchObject({ variant });
    },
  );

  it.each(Object.keys(validVariantByType))(
    'falla cuando variant no está permitida para %s',
    async (type) => {
      await expect(
        validateSectionData(type as WebsiteSectionType, { variant: 'invalid-variant' }),
      ).rejects.toMatchObject({ statusCode: 422 });
    },
  );

  it.each(Object.keys(validVariantByType))(
    'funciona si variant no llega para %s',
    async (type) => {
      const data = await validateSectionData(type as WebsiteSectionType, {});
      expect(data).toEqual({});
    },
  );

  it('acepta theme de página válido en HERO', async () => {
    const data = await validateSectionData('HERO', { theme: 'premium' });
    expect(data).toMatchObject({ theme: 'premium' });
  });

  it('acepta theme legado en HERO por compatibilidad', async () => {
    const data = await validateSectionData('HERO', { theme: 'vibrante' });
    expect(data).toMatchObject({ theme: 'vibrante' });
  });

  it('rechaza theme inválido en HERO', async () => {
    await expect(
      validateSectionData('HERO', { theme: 'retro' }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });
});
