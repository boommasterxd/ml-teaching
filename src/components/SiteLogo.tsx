import { Brain } from './icons/brain';

/** Reuse the original Brain glyph with the shared theme and icon motion. */
export default function SiteLogo({ size = 32, className }: { size?: number; className?: string }) {
  return <Brain size={size} className={className} aria-hidden="true" />;
}
