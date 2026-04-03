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
} as const;
