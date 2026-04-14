/**
 * Security utilities — input sanitization, URL validation, JWT inspection,
 * and sensitive-data masking.
 */

// ─── Input Sanitization ──────────────────────────────────────────────────────

const XSS_PATTERN = /[<>"'&]/g;
const XSS_REPLACEMENTS: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '&': '&amp;',
};

/**
 * Strips common XSS vectors from user input.
 */
export function sanitizeInput(str: string): string {
  return str.replace(XSS_PATTERN, (char) => XSS_REPLACEMENTS[char] ?? char);
}

// ─── URL Validation ──────────────────────────────────────────────────────────

const ALLOWED_HOSTS = [
  'api.freeapi.app',
  'freeapi.app',
  'res.cloudinary.com',
] as const;

/**
 * Returns true only if `url` is an HTTPS URL on a whitelisted host.
 * Use before allowing WebView navigation or opening external links.
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

// ─── JWT Inspection ──────────────────────────────────────────────────────────

interface JwtPayload {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function decodeBase64Url(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

/**
 * Returns true when the JWT's `exp` claim is in the past (or missing).
 * Does NOT verify the signature — that's the server's responsibility.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(decodeBase64Url(parts[1]!)) as JwtPayload;
    if (typeof payload.exp !== 'number') return true;
    // Give 30 s buffer so we refresh before actual expiry
    return payload.exp * 1000 < Date.now() - 30_000;
  } catch {
    return true;
  }
}

// ─── Sensitive Data Masking ──────────────────────────────────────────────────

const EMAIL_RE = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

/**
 * Redacts emails and password-like fields from an object before logging.
 */
export function maskSensitiveData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.replace(EMAIL_RE, (_, user: string) => `${user.slice(0, 2)}***@***`);
  }
  if (typeof data !== 'object' || data === null) return data;

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (/password|secret|token|authorization/i.test(key)) {
      masked[key] = '***REDACTED***';
    } else {
      masked[key] = maskSensitiveData(value);
    }
  }
  return masked;
}

// ─── Security Headers ────────────────────────────────────────────────────────

/**
 * Headers added to every API request by the Axios interceptor:
 *
 * - Authorization: Bearer {token}   – authenticates the user
 * - X-Request-ID: {uuid}            – correlates logs end-to-end
 * - X-App-Version: {version}        – helps server apply version-specific logic
 * - X-Platform: ios | android       – analytics / feature flags
 *
 * In production:
 * - NEVER log Authorization or request bodies via Sentry breadcrumb scrubbing
 * - Correlation IDs rotate per session to limit tracking surface
 */
