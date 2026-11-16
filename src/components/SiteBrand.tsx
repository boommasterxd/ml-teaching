import AnimatedLink from './AnimatedLink';
import SiteLogo from './SiteLogo';

export default function SiteBrand() {
  return (
    <AnimatedLink href="/" variant="brand" size="brand" aria-label="ML Teaching – Startseite">
      <SiteLogo className="brand-mark" />
      <span>ML Teaching</span>
    </AnimatedLink>
  );
}
