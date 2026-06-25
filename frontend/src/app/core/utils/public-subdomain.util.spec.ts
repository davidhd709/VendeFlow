import {
  extractSubdomainFromHostname,
  resolvePublicSubdomain,
} from './public-subdomain.util';

describe('public-subdomain.util', () => {
  it('usa ?sub si existe', () => {
    const value = resolvePublicSubdomain('empresa-query', 'otra.salesflow.com');
    expect(value).toBe('empresa-query');
  });

  it('usa subdominio del host si no llega ?sub', () => {
    const value = resolvePublicSubdomain('', 'empresa-host.salesflow.com');
    expect(value).toBe('empresa-host');
  });

  it('retorna vacío cuando no puede resolver tenant', () => {
    const value = resolvePublicSubdomain('', 'localhost:4200');
    expect(value).toBe('');
  });

  it('ignora prefijo reservado www', () => {
    expect(extractSubdomainFromHostname('www.salesflow.com')).toBe('');
  });
});
