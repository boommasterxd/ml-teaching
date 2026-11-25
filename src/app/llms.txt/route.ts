import {
  publicDiscoveryDescription,
  publicDiscoverySections,
  publicDiscoveryUrl,
} from '@/content/public-discovery';
import { siteConfig } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
  const sections = publicDiscoverySections.map(({ title, pages }) => {
    const links = pages.map(
      (page) => `- [${page.title}](${publicDiscoveryUrl(page.path).href}): ${page.description}`,
    );
    return `## ${title}\n\n${links.join('\n')}`;
  });
  const markdown = [`# ${siteConfig.name}`, `> ${publicDiscoveryDescription}`, ...sections].join(
    '\n\n',
  );

  return new Response(`${markdown}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
}
