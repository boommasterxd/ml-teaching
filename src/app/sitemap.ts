import type { MetadataRoute } from 'next';
import { publicDiscoverySections, publicDiscoveryUrl } from '@/content/public-discovery';

export default function sitemap(): MetadataRoute.Sitemap {
  return publicDiscoverySections.flatMap(({ pages }) =>
    pages.map(({ path }) => {
      const url = publicDiscoveryUrl(path);
      return { url: path === '/' ? url.origin : url.href };
    }),
  );
}
