/**
 * Server-side constants for Express configuration.
 */

export const SERVER = {
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 1000,
  HSTS_MAX_AGE: 31_536_000,
} as const;
