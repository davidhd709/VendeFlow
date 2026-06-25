import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { parseDuration } from '../common/utils/parse-duration';
import { SafeUser, sanitizeUser } from '../common/utils/sanitize-user';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

// Hash bcrypt de descarte para igualar el tiempo de respuesta cuando el usuario no existe.
const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuv0123456789012345678901234567890';

export type SafeUserWithCompany = SafeUser & { companyName: string | null };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string; // valor en claro: va en la cookie httpOnly
  refreshExpiresAt: Date;
  user: SafeUserWithCompany;
}

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, ctx: RequestContext = {}): Promise<AuthTokens> {
    let companyId: string | null = null;

    if (dto.subdomain) {
      const company = await this.prisma.company.findUnique({
        where: { subdomain: dto.subdomain },
      });
      if (!company || company.status === 'SUSPENDED') {
        throw new UnauthorizedException('Credenciales inválidas');
      }
      companyId = company.id;
    }

    const user = await this.prisma.user.findFirst({
      where: { username: dto.username, companyId },
    });

    const passwordOk = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !user.isActive || !passwordOk) {
      await this.audit.record({
        companyId,
        action: 'login.failed',
        ip: ctx.ip,
        metadata: { username: dto.username },
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.issueTokens(user, ctx);
  }

  async refresh(
    rawToken: string | undefined,
    ctx: RequestContext = {},
  ): Promise<AuthTokens> {
    if (!rawToken) throw new UnauthorizedException('Sesión expirada');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive
    ) {
      throw new UnauthorizedException('Sesión expirada');
    }

    // Si el usuario pertenece a una empresa, verificar que no esté suspendida.
    if (stored.user.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: stored.user.companyId },
        select: { status: true },
      });
      if (!company || company.status === 'SUSPENDED') {
        throw new UnauthorizedException('Sesión expirada');
      }
    }

    // Rotación: el refresh token usado se revoca y se emite uno nuevo.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user, ctx);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<SafeUserWithCompany> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const companyName = await this.resolveCompanyName(user.companyId);
    return { ...sanitizeUser(user), companyName };
  }

  private async issueTokens(
    user: User,
    ctx: RequestContext,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
      officeId: user.officeId,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlMs());

    const [, companyName] = await Promise.all([
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: refreshExpiresAt,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        },
      }),
      this.resolveCompanyName(user.companyId),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt,
      user: { ...sanitizeUser(user), companyName },
    };
  }

  private async resolveCompanyName(companyId: string | null): Promise<string | null> {
    if (!companyId) return null;
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    return company?.name ?? null;
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private refreshTtlMs(): number {
    return parseDuration(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
  }
}
