import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { parse } from 'parse5';

/** @param {string | Buffer} content @param {'sha256' | 'sha384' | 'sha512'} algorithm */
export function digest(content, algorithm = 'sha256') {
  return `${algorithm}-${createHash(algorithm).update(content).digest('base64')}`;
}

/** @param {string | Buffer} content */
export function assetHashes(content) {
  /** @type {Partial<Record<'sha256' | 'sha384' | 'sha512', string>>} */
  const hashes = {};
  /** @param {'sha256' | 'sha384' | 'sha512'} algorithm */
  const cached = (algorithm) => (hashes[algorithm] ??= digest(content, algorithm));
  return {
    get sha256() {
      return cached('sha256');
    },
    get sha384() {
      return cached('sha384');
    },
    get sha512() {
      return cached('sha512');
    },
  };
}

/** @param {import('parse5').DefaultTreeAdapterTypes.Node} node */
function children(node) {
  if ('content' in node) return [...node.childNodes, ...node.content.childNodes];
  return 'childNodes' in node ? node.childNodes : [];
}

/** @param {import('parse5').DefaultTreeAdapterTypes.Element} node */
function validateElement(node) {
  for (const attribute of node.attrs) {
    if (
      attribute.name === 'nonce' ||
      attribute.name === 'style' ||
      attribute.name.startsWith('on')
    ) {
      throw new Error(`Static CSP rejects ${attribute.name} on <${node.tagName}>`);
    }
    if (
      /^[\u0000-\u0020]*(?:javascript|vbscript):/iu.test(attribute.value) ||
      /^[\u0000-\u0020]*data:text\/html/iu.test(attribute.value)
    ) {
      throw new Error(`Static CSP rejects executable URLs on <${node.tagName}>`);
    }
  }
  if (node.tagName === 'base') throw new Error('Static CSP rejects <base>');
  if (
    node.tagName === 'meta' &&
    node.attrs.some(
      (a) => a.name === 'http-equiv' && a.value.toLowerCase().startsWith('content-security-policy'),
    )
  ) {
    throw new Error('Static CSP rejects competing meta policies');
  }
}

/**
 * Browser-compatible parsing with source offsets preserves all original document bytes.
 * @param {string} html
 * @param {import('./types.js').AssetLookup} assets Same-origin script URL -> lazily verified hashes.
 * @param {string | undefined} deploymentId Trusted native Next.js deployment ID.
 */
export async function prepareDocument(html, assets, deploymentId = undefined) {
  if (Buffer.byteLength(html) > 8 * 1024 * 1024) throw new Error('Static HTML exceeds 8 MiB');
  const document = parse(html, { sourceCodeLocationInfo: true });
  const scripts = new Set();
  const styles = new Set();
  /** @type {Array<{offset: number, text: string}>} */
  const insertions = [];
  const pending = [...document.childNodes];
  while (pending.length) {
    const node = pending.pop();
    if (!node) continue;
    pending.push(...children(node));
    if (!('tagName' in node)) continue;
    validateElement(node);
    const rel = node.attrs.find((attribute) => attribute.name === 'rel')?.value;
    const as = node.attrs.find((attribute) => attribute.name === 'as')?.value;
    if (
      node.tagName === 'script' ||
      (node.tagName === 'link' &&
        (rel === 'modulepreload' || (rel === 'preload' && as === 'script')))
    ) {
      await collectScript(node, { assets, scripts, insertions, deploymentId });
    }
    if (node.tagName === 'style') styles.add(digest(textContent(node)));
  }
  for (const insertion of insertions.sort((a, b) => b.offset - a.offset)) {
    html = html.slice(0, insertion.offset) + insertion.text + html.slice(insertion.offset);
  }
  return { html, scripts: [...scripts].sort(), styles: [...styles].sort() };
}

/** @param {import('parse5').DefaultTreeAdapterTypes.Element} node */
function textContent(node) {
  return node.childNodes.map((child) => ('value' in child ? child.value : '')).join('');
}

/**
 * @param {import('parse5').DefaultTreeAdapterTypes.Element} node
 * @param {{assets: import('./types.js').AssetLookup, scripts: Set<string>,
 * insertions: Array<{offset: number, text: string}>, deploymentId?: string}} state
 */
async function collectScript(node, { assets, scripts, insertions, deploymentId }) {
  const src = node.attrs.find(
    (attribute) => attribute.name === (node.tagName === 'link' ? 'href' : 'src'),
  )?.value;
  if (src === undefined) {
    scripts.add(digest(textContent(node)));
    return;
  }
  const hashes = await assets.get(scriptPath(src, deploymentId));
  if (!hashes) throw new Error(`Script is absent from static build outputs: ${src}`);
  const existing = node.attrs.find((attribute) => attribute.name === 'integrity');
  const tokens = existing
    ? existing.value
        .trim()
        .split(/\s+/u)
        .filter((token) => /^sha(?:256|384|512)-/u.test(token))
    : [hashes.sha256];
  if (
    !tokens.length ||
    tokens.some(
      (token) =>
        hashes[/** @type {'sha256' | 'sha384' | 'sha512'} */ (token.split('-')[0])] !== token,
    )
  ) {
    throw new Error(`Script integrity mismatch: ${src}`);
  }
  if (!existing) {
    const location = node.sourceCodeLocation?.startTag;
    if (!location) throw new Error(`Missing script source location: ${src}`);
    insertions.push({ offset: location.endOffset - 1, text: ` integrity="${hashes.sha256}"` });
  }
  tokens.forEach((token) => scripts.add(token));
}

/** Preserve the native skew-protection query while binding SRI to the exact same-origin output bytes.
 * @param {string} src @param {string | undefined} deploymentId
 */
function scriptPath(src, deploymentId) {
  const pathname = src.split(/[?#]/u)[0];
  if (
    !pathname.startsWith('/_next/static/') ||
    /[\\\u0000-\u0020]/u.test(src) ||
    /%/u.test(pathname) ||
    pathname.split('/').some((part) => part === '.' || part === '..') ||
    src.includes('#')
  ) {
    throw new Error(`Only emitted same-origin Next.js scripts are supported: ${src}`);
  }
  const url = new URL(src, 'https://hash-csp.invalid');
  if (
    src.includes('?') &&
    (!deploymentId || url.searchParams.size !== 1 || url.searchParams.get('dpl') !== deploymentId)
  ) {
    throw new Error(`Unsupported script query: ${src}`);
  }
  return url.pathname;
}
