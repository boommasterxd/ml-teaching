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
