import JsonLd from '@/components/JsonLd';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { learningPaths } from '@/lib/learning-paths';
import { siteConfig } from '@/lib/site';

const imageLearningTrail = [
  { name: 'Lernlabor', path: learningPaths.hub },
  { name: 'Bilderkennung verstehen', path: learningPaths.images },
  { name: 'Bildmodell trainieren', path: learningPaths.imagePractice },
] as const;

type ImageLearningPath = typeof learningPaths.images | typeof learningPaths.imagePractice;

export default function LearningBreadcrumbs({ currentPath }: { currentPath: ImageLearningPath }) {
  const items = imageLearningTrail.slice(0, currentPath === learningPaths.images ? 2 : 3);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: new URL(path, siteConfig.url).href,
    })),
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <Breadcrumb aria-label="Seitenpfad" className="pt-3 sm:pt-4">
        <BreadcrumbList>
          {items.map(({ name, path }) => (
            <BreadcrumbItem key={path}>
              {path === currentPath ? (
                <BreadcrumbPage>{name}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink href={path} transitionTypes={['nav-back']}>
                    {name}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
