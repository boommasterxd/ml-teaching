import type { ReactNode } from 'react';
import ErrorGlassArtwork from '@/components/hero/ErrorGlassArtwork';
import { Heading, Text } from '@/components/ui/typography';

interface PublicErrorSceneProps {
  code?: '404' | '500';
  title: string;
  description: string;
  children: ReactNode;
  announce?: boolean;
}

export default function PublicErrorScene({
  code,
  title,
  description,
  children,
  announce,
}: PublicErrorSceneProps) {
  return (
    <section className="public-error-scene" data-code={code} aria-labelledby="public-error-title">
      <div className="public-error-copy">
        <div role={announce ? 'alert' : undefined} className="public-error-message">
          {code === '500' && <p className="public-error-status">Fehler {code}</p>}
          <Heading as="h1" id="public-error-title">
            {title}
          </Heading>
          <Text variant="muted">{description}</Text>
        </div>
        <div className="public-error-actions">{children}</div>
      </div>
      <div className="public-error-visual">
        <div className="public-error-orbit" aria-hidden="true" />
        {code === '500' && (
          <span className="public-error-display" aria-hidden="true">
            {code}
          </span>
        )}
        <ErrorGlassArtwork digits={code === '404'} />
      </div>
    </section>
  );
}
