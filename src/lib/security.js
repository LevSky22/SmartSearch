export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'document-domain=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cache-Control': 'no-store, max-age=0',
  'X-DNS-Prefetch-Control': 'off'
}; 