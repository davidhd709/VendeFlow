import { ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../../src/common/types/auth-user';

/** ExecutionContext mínimo para probar guards en aislamiento. */
export function mockExecutionContext(
  user: Partial<AuthUser> | null,
  params: Record<string, string> = {},
): ExecutionContext {
  const request = { user: user ?? undefined, params };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => () => undefined,
    getClass: () => class {},
    getType: () => 'http',
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
  } as unknown as ExecutionContext;
}
