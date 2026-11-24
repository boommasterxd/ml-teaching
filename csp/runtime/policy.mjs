import { Buffer } from 'node:buffer';

// Validation minima only. Effective directives are always read from project configuration.
const required = new Map([
  ['default-src', "'none'"],
  ['script-src', "'strict-dynamic'"],
  ['script-src-attr', "'none'"],
  ['style-src', "'self'"],
  ['style-src-attr', "'none'"],
  ['object-src', "'none'"],
  ['base-uri', "'none'"],
  ['frame-ancestors', "'none'"],
  ['form-action', "'self'"],
]);
const resources = new Set([
  'img-src',
  'font-src',
  'connect-src',
  'frame-src',
  'media-src',
  'worker-src',
  'manifest-src',
]);

/** @param {string} source */
function validSource(source) {
  if (["'self'", "'none'", 'data:', 'blob:'].includes(source)) return true;
  try {
    const url = new URL(source);
    return (
      url.protocol === 'https:' &&
      url.origin === source &&
      !source.includes('*') &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

/** @param {unknown} value */
function directiveMap(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** @param {import('./types.js').PolicyDefinitions} definitions @param {'ssg' | 'ssr'} mode */
function configuredPolicy(definitions, mode) {
  if (!directiveMap(definitions) || !directiveMap(definitions.base)) {
    throw new Error('CSP configuration requires policies.base and directive-map mode overrides');
  }
  if (Object.keys(definitions).some((key) => !['base', 'ssg', 'ssr'].includes(key))) {
    throw new Error('Unknown CSP policy configuration key');
  }
  const base = validateDirectives(definitions.base);
  const policies = { ssg: base, ssr: base };
  for (const variant of /** @type {const} */ (['ssg', 'ssr'])) {
    if (definitions[variant] === undefined) continue;
    if (!directiveMap(definitions[variant]))
      throw new Error('CSP configuration requires directive-map mode overrides');
    policies[variant] = validateDirectives({ ...base, ...definitions[variant] });
  }
  return policies[mode];
}

/** @param {Record<string, string[]>} directives */
function validateDirectives(directives) {
  for (const [name, value] of required) {
    const values = directives[name];
    if (!Array.isArray(values) || values.length !== 1 || values[0] !== value) {
      throw new Error(`CSP configuration weakens or omits required ${name}`);
    }
  }
  for (const [name, values] of Object.entries(directives)) {
    if (required.has(name)) continue;
    if (
      !resources.has(name) ||
      !Array.isArray(values) ||
      !values.length ||
      values.some((value) => typeof value !== 'string' || !validSource(value)) ||
      (values.includes("'none'") && values.length > 1)
    ) {
      throw new Error(`Unsupported CSP resource directive: ${name}`);
    }
  }
  return directives;
}

/** @param {Record<string, string[]>} directives @param {string[]} scripts @param {string[]} styles */
function headerFor(directives, scripts, styles) {
  const authorized = {
    ...directives,
    'script-src': [...directives['script-src'], ...scripts],
    'style-src': [...directives['style-src'], ...styles],
  };
  const policy = Object.entries(authorized)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
  if (Buffer.byteLength(policy) > 16000) throw new Error('CSP header exceeds 16000-byte budget');
  return policy;
}

/** @param {string[]} hashes */
function quoteHashes(hashes) {
  const valid =
    /^(?:sha256-[A-Za-z0-9+/]{43}=|sha384-[A-Za-z0-9+/]{64}|sha512-[A-Za-z0-9+/]{86}==)$/u;
  if (!Array.isArray(hashes) || hashes.some((value) => !valid.test(value))) {
    throw new Error('Invalid generated CSP hash');
  }
  return hashes.map((value) => `'${value}'`);
}

/** @param {{scripts: string[], styles: string[]}} hashes
 * @param {import('./types.js').PolicyDefinitions} definitions */
export function policyFor(hashes, definitions) {
  return headerFor(
    configuredPolicy(definitions, 'ssg'),
    quoteHashes(hashes.scripts),
    quoteHashes(hashes.styles),
  );
}

/** The caller owns cryptographic generation, freshness and trusted request forwarding.
 * @param {string} nonce @param {import('./types.js').PolicyDefinitions} definitions
 * @param {{scripts: string[], styles: string[]}} [trustedHashes]
 */
export function noncePolicyFor(nonce, definitions, trustedHashes = { scripts: [], styles: [] }) {
  if (typeof nonce !== 'string' || !/^[A-Za-z0-9+/_-]{22,256}={0,2}$/u.test(nonce)) {
    throw new Error('Invalid CSP nonce');
  }
  const authorization = `'nonce-${nonce}'`;
  return headerFor(
    configuredPolicy(definitions, 'ssr'),
    [authorization, ...quoteHashes(trustedHashes.scripts)],
    [authorization, ...quoteHashes(trustedHashes.styles)],
  );
}
