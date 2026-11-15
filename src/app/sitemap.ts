import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/lernen', '/impressum', '/datenschutz', '/barrierefreiheit'].map((path) => ({
    url: `${siteConfig.url}${path === '/' ? '' : path}`,
  }));
}
