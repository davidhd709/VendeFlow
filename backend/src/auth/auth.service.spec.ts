import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createPrismaMock, PrismaMock } from '../../test/helpers/prisma-mock';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let audit: { record: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = { record: jest.fn() };
    const jwt = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as unknown as JwtService;
    const config = {
      get: jest.fn().mockReturnValue('7d'),
    } as unknown as ConfigService;
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      config,
      audit as unknown as AuditService,
    );
  });

  it('lanza 401 y audita cuando la contraseña es incorrecta', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'c1',
      status: 'ACTIVE',
    } as never);
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      passwordHash: 'h',
      isActive: true,
    } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ subdomain: 's', username: 'admin', password: 'bad' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'login.failed' }),
    );
  });

  it('emite tokens y guarda el refresh token con credenciales válidas', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'c1',
      status: 'ACTIVE',
    } as never);
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      username: 'admin',
      role: 'ADMIN',
      companyId: 'c1',
      officeId: null,
      passwordHash: 'h',
      isActive: true,
    } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    prisma.refreshToken.create.mockResolvedValue({} as never);

    const result = await service.login({
      subdomain: 's',
      username: 'admin',
      password: 'ok',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rechaza el login si la empresa está suspendida', async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 'c1',
      status: 'SUSPENDED',
    } as never);

    await expect(
      service.login({ subdomain: 's', username: 'admin', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
