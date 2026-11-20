'use client';

import AnimatedLink from '@/components/AnimatedLink';
import Button from '@/components/Button';
import PublicErrorScene from '@/components/PublicErrorScene';
import AppErrorGlassArtwork from '@/components/hero/AppErrorGlassArtwork';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PublicErrorScene
      artwork={<AppErrorGlassArtwork />}
      title="Diese Seite konnte nicht geladen werden"
      description="Bitte versuche es erneut."
      announce
    >
      <Button size="lg" onClick={reset}>
        Erneut versuchen
      </Button>
      <AnimatedLink href="/" transitionTypes={['nav-back']} variant="outline" size="lg">
        Zur Startseite
      </AnimatedLink>
    </PublicErrorScene>
  );
}
