import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../types/auth-user';

/**
 * Defensa en profundidad para rutas que reciben :companyId en los params.
 * El aislamiento real vive en los servicios (where companyId = req.user.companyId);
 * este guard corta el acceso explícito a un tenant ajeno vía param.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUser; params?: Record<string, string> }>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Acceso denegado');
    if (user.role === Role.SUPERADMIN) return true;

    const paramCompanyId = request.params?.companyId;
    if (paramCompanyId && paramCompanyId !== user.companyId) {
      throw new ForbiddenException('Acceso denegado a este tenant');
    }
    return true;
  }
}
