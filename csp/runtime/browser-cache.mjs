/** @param {import('./types.js').Options} options */
export function browserMaxAge(options) {
  const seconds = options.browserMaxAgeSeconds === undefined ? 300 : options.browserMaxAgeSeconds;
  if (!Number.isSafeInteger(seconds) || seconds < 0) {
    throw new Error('browserMaxAgeSeconds must be a nonnegative safe integer');
  }
  return seconds;
}

/** Reject inherited overrides instead of silently hiding a project's cache policy.
 * @param {Record<string, unknown>} headers @param {string} pathname
 */
export function assertCacheHeaders(headers, pathname) {
  for (const [name, value] of Object.entries(headers)) {
    const key = name.toLowerCase();
    if (
      key === 'cache-control' ||
      (['cdn-cache-control', 'vercel-cdn-cache-control'].includes(key) &&
        /(?:^|,)\s*(?:private|no-store|no-cache)(?:\s|,|$)/iu.test(String(value)))
    ) {
      throw new Error(`Competing static cache header: ${pathname} (${name})`);
    }
  }
}

/** Public HTML URL freshness, excluding selected errors and RSC/action/draft owners.
 * @param {import('./types.js').DocumentOutput} document
 * @param {import('./types.js').Options} options
 */
export function browserCacheRoute(document, options) {
  if (options.errorRoutes?.includes(document.pathname)) return undefined;
  const escaped = document.pathname.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return {
    source: document.pathname,
    sourceRegex: `^${escaped}${document.pathname === '/' ? '' : '/?'}$`,
    missing: [
      { type: 'header', key: 'rsc' },
      { type: 'header', key: 'next-action' },
      { type: 'header', key: 'content-type' },
      { type: 'cookie', key: '__prerender_bypass' },
      { type: 'cookie', key: '__next_preview_data' },
    ],
    headers: { 'Cache-Control': `public, max-age=${browserMaxAge(options)}, must-revalidate` },
  };
}
