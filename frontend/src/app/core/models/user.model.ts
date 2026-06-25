import { Role } from '../constants/roles';

/** Usuario autenticado tal como lo devuelve /auth/me (sin passwordHash). */
export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: Role;
  companyId: string | null;
  companyName: string | null;
  officeId: string | null;
  mustChangePassword?: boolean;
}

export interface LoginRequest {
  subdomain?: string; // ausente para SUPERADMIN; resuelve la empresa para el resto
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/** Usuario gestionado por el ADMIN (sin passwordHash). */
export interface ManagedUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: Role;
  companyId: string | null;
  officeId: string | null;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear un usuario — el backend auto-genera la contraseña temporal. */
export interface CreateUser {
  username: string;
  name: string;
  email?: string;
  role: Role;
  officeId?: string;
}

/** Respuesta al crear un usuario: incluye la contraseña temporal (única vez). */
export interface CreateUserResponse {
  user: ManagedUser;
  tempPassword: string;
}

/** Respuesta al restablecer la contraseña de un usuario. */
export interface ResetPasswordResponse {
  tempPassword: string;
}

export interface UpdateUser {
  name?: string;
  email?: string;
  role?: Role;
  officeId?: string | null;
}
