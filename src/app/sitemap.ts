import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';
import { learningPaths } from '@/lib/learning-paths';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '/',
    learningPaths.hub,
    learningPaths.images,
    learningPaths.imagePractice,
    '/impressum',
    '/datenschutz',
    '/barrierefreiheit',
  ].map((path) => ({
    url: `${siteConfig.url}${path === '/' ? '' : path}`,
  }));
}
