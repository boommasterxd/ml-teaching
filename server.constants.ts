/**
 * server.constants.ts
 *
 * Server-side constants for the Express application configuration.
 * Centralizes numeric values used in HTTP security headers and middleware.
 */

/**
 * Configuration constants for the Express server.
 */
export const SERVER = {
  /** HSTS max-age in seconds (365 days = 1 year). */
  HSTS_MAX_AGE: 31_536_000,
  /** Rate-limit window duration in milliseconds (15 minutes). */
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  /**
   * Maximum number of requests per IP within a single rate-limit window.
   * Set to 3000 to accommodate school environments where many students share
   * a single public IP via NAT. A first page load costs ~10 requests; after
   * that, assets are cached (1-year headers) so only index.html is re-fetched.
   * 3000 covers roughly 300 first-time page loads (≈ 10 school classes) per window.
   */
  RATE_LIMIT_MAX_REQUESTS: 3000,
  /** Rate-limit window for the CSP report endpoint in milliseconds (15 minutes). */
  CSP_REPORT_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  /** Maximum CSP violation reports per IP within a single rate-limit window. */
  CSP_REPORT_RATE_LIMIT_MAX: 10,
  /** Maximum payload size accepted by the CSP report endpoint. */
  CSP_REPORT_MAX_BODY_SIZE: '10kb',
  /** URL path of the CSP violation report endpoint. */
  CSP_REPORT_PATH: '/csp-report',
} as const;

/**
 * Shared Content Security Policy directives used in both production (enforced)
 * and development (report-only) mode. The only difference between the two modes
 * is the `reportOnly` flag in the Helmet configuration — the directives themselves
 * are identical, so they are centralized here to avoid duplication.
 *
 * - `default-src 'none'`: deny-by-default; every unlisted resource type is blocked.
 * - `script-src 'self'`: wasm-unsafe-eval is intentionally omitted — the app forces
 *   the WebGL backend of TensorFlow.js, not the WASM backend.
 * - `img-src data:`: required for camera captures (canvas.toDataURL).
 * - `connect-src`: scoped to Google Storage, TensorFlow Hub, and Kaggle for MobileNet
 *   model downloads.
 * - `worker-src blob:`: TensorFlow.js spawns Web Workers via blob: URLs.
 * - `media-src 'none'`: camera uses srcObject (not URL-based src) — media-src does
 *   not apply to WebRTC.
 * - `base-uri 'none'`: no <base> tag in the app — prevents base-tag injection via XSS.
 * - `form-action 'none'`: no form submissions in the app.
 * - `script-src-attr 'none'`: explicitly blocks inline event handlers (onclick=, …).
 * - `style-src-attr 'none'`: explicitly blocks inline style attributes (style="…").
 */
export const CSP_DIRECTIVES = {
  "default-src": ["'none'"],
  "script-src": ["'self'", "'wasm-unsafe-eval'"],
  "style-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "connect-src": ["'self'", "https://storage.googleapis.com", "https://*.gstatic.com", "https://tfhub.dev", "https://www.kaggle.com"],
  "worker-src": ["blob:"],
  "media-src": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'none'"],
  "frame-ancestors": ["'none'"],
  "font-src": ["'self'"],
  "script-src-attr": ["'none'"],
  "style-src-attr": ["'none'"],
  "upgrade-insecure-requests": [],
  "report-uri": [SERVER.CSP_REPORT_PATH],
} as const;
