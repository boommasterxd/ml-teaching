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
} as const;
