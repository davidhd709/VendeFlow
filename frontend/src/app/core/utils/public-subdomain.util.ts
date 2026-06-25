const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
const RESERVED_SUBDOMAINS = new Set(['www', 'vendeflow', 'app', 'api', 'admin']);
const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

function normalizeCandidate(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function sanitizeSubdomain(value: string | null | undefined): string {
  const candidate = normalizeCandidate(value);
  if (!candidate) return '';
  if (!SUBDOMAIN_PATTERN.test(candidate)) return '';
  if (RESERVED_SUBDOMAINS.has(candidate)) return '';
  return candidate;
}

export function extractSubdomainFromHostname(hostname: string): string {
  const host = normalizeCandidate(hostname).split(':')[0];
  if (!host || LOCAL_HOSTS.has(host)) return '';

  if (host.endsWith('.localhost')) {
    const candidate = host.slice(0, -'.localhost'.length);
    return sanitizeSubdomain(candidate);
  }

  const labels = host.split('.').filter(Boolean);
  if (labels.length < 3) return '';
  return sanitizeSubdomain(labels[0]);
}

export function resolvePublicSubdomain(
  querySubdomain: string | null | undefined,
  hostname: string,
): string {
  const fromQuery = sanitizeSubdomain(querySubdomain);
  if (fromQuery) return fromQuery;
  return extractSubdomainFromHostname(hostname);
}
