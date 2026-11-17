import type { ReactNode } from 'react';
import LegalReadingSections from './LegalReadingSections';
import { Card, CardContent, CardHeader } from './ui/card';
import { Heading } from './ui/typography';

/** Controlled legal copy uses one central typography system in both themes. */
export default function PageContent({
  id,
  labelledBy,
  title,
  children,
}: {
  id?: string;
  labelledBy: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className="legal-section">
      <Card className="legal-document">
        <article className="legal-content">
          <CardHeader className="legal-document-header">
            <Heading as="h1" variant="document" id={labelledBy}>
              {title}
            </Heading>
          </CardHeader>
          <CardContent className="legal-document-body">
            <LegalReadingSections>{children}</LegalReadingSections>
          </CardContent>
        </article>
      </Card>
    </section>
  );
}
