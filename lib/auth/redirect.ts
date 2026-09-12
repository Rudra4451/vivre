/**
 * Safe redirect path sanitizer.
 * 
 * Protects against CWE-601: URL Redirection to Untrusted Site ('Open Redirect').
 * Guarantees that untrusted query parameters (e.g. `?next=//attacker.com` or `?next=https://evil.com`)
 * cannot redirect the user to an external origin or execute malicious schemas.
 */
export function sanitizeRedirectUrl(
  untrustedPath: string | null | undefined,
  fallback: string = "/app"
): string {
  if (!untrustedPath || typeof untrustedPath !== "string") {
    return fallback;
  }

  const trimmed = untrustedPath.trim();

  // Reject empty string or strings containing control characters (CRLF injection)
  if (!trimmed || /[\r\n\t\x00-\x1f]/.test(trimmed)) {
    return fallback;
  }

  // Must strictly start with a single forward slash and NOT double slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject any protocol indicators (http:, javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
