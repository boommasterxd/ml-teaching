import { expect, test } from '@playwright/test';
import { learningPaths } from '../../src/lib/learning-paths';

test('public slash redirects preserve the URL and reach the canonical secured page', async ({
  request,
}) => {
  const query = 'tag=one&tag=two&next=https%3A%2F%2Fexample.com%2F';
  const response = await request.get(`${learningPaths.images}/?${query}`, { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  const location = new URL(response.headers().location, response.url());
  expect(location.origin).toBe(new URL(response.url()).origin);
  expect(location.pathname).toBe(learningPaths.images);
  expect(location.searchParams.getAll('tag')).toEqual(['one', 'two']);
  expect(location.searchParams.get('next')).toBe('https://example.com/');
  const canonical = await request.get(location.href, { maxRedirects: 0 });
  expect(canonical.status()).toBe(200);
  expect(canonical.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(canonical.headers()['strict-transport-security']).toBe(
    'max-age=31536000; includeSubDomains; preload',
  );
});

test('slash redirects preserve path case and leave internal assets to Next.js', async ({
  request,
}) => {
  const redirect = await request.head('/Datenschutz/', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(new URL(redirect.headers().location, redirect.url()).pathname).toBe('/Datenschutz');
  const internal = await request.get('/_next/static/', { maxRedirects: 0 });
  expect(internal.headers().location).toBeUndefined();
});

test('the direct 404 response has strict CSP and cannot be stored', async ({ request }) => {
  for (const method of ['GET', 'HEAD']) {
    const response = await request.fetch('/404', { method });
    expect(response.status()).toBe(404);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['content-type']).toContain('text/html');
    const policies = response
      .headersArray()
      .filter(({ name }) => name.toLowerCase() === 'content-security-policy');
    expect(policies).toHaveLength(1);
    expect(policies[0].value).toContain("frame-ancestors 'none'");
    if (method === 'GET') expect(await response.text()).toContain('Seite nicht gefunden');
  }

  const page = await request.get(learningPaths.hub);
  expect(page.headers()['cache-control']).toBe('public, max-age=300, must-revalidate');
  const payload = await request.get(learningPaths.hub, { headers: { RSC: '1' } });
  expect(payload.status()).toBe(200);
  expect(payload.headers()['content-type']).toContain('text/x-component');
  expect(payload.headers()['cache-control']).not.toContain('max-age=300');
});
