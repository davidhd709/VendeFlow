import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

export type PrismaMock = DeepMockProxy<PrismaClient>;

export function createPrismaMock(): PrismaMock {
  return mockDeep<PrismaClient>();
}
