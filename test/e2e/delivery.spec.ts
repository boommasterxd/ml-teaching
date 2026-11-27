import { expect, test, type APIResponse } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';

function expectStrictPolicy(response: APIResponse) {
  const policies = response
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === 'content-security-policy');
  expect(policies).toHaveLength(1);
  const directives = policies[0].value.split(';').map((directive) => directive.trim());
  expect(directives).toEqual(
    expect.arrayContaining(["default-src 'none'", "frame-ancestors 'none'", "object-src 'none'"]),
  );
  expect(policies[0].value).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);
}

test('canonical public HTML has strict security headers and its cache policy excludes RSC', async ({
  request,
}) => {
  const redirect = await request.get(`${learningPaths.images}/?tag=one&tag=two`, {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(308);
  const canonicalUrl = new URL(redirect.headers().location, redirect.url());
  expect(canonicalUrl.origin).toBe(new URL(redirect.url()).origin);
  expect(canonicalUrl.pathname).toBe(learningPaths.images);
  expect(canonicalUrl.searchParams.getAll('tag')).toEqual(['one', 'two']);

  const html = await request.get(canonicalUrl.href, { maxRedirects: 0 });
  expect(html.status()).toBe(200);
  expect(html.headers()['content-type']).toContain('text/html');
  expect(html.headers()['strict-transport-security']).toBe(
    'max-age=31536000; includeSubDomains; preload',
  );
  expect(html.headers()['cache-control']).toBe('public, max-age=300, must-revalidate');
  expectStrictPolicy(html);

  const payload = await request.get(canonicalUrl.href, { headers: { RSC: '1' } });
  expect(payload.status()).toBe(200);
  expect(payload.headers()['content-type']).toContain('text/x-component');
  expect(payload.headers()['cache-control']).not.toContain('max-age=300');
});

test('native error documents keep strict CSP and /404 forbids storage', async ({ request }) => {
  const errors = [
    { path: '/404', status: 404, title: 'Seite nicht gefunden' },
    { path: '/missing-delivery-test-page', status: 404, title: 'Seite nicht gefunden' },
    { path: '/500', status: 500, title: 'Diese Seite konnte nicht geladen werden' },
  ];
  for (const { path, status, title } of errors) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(status);
    if (path === '/404') expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['content-type']).toContain('text/html');
    expectStrictPolicy(response);
    expect(await response.text()).toContain(title);
  }
});
