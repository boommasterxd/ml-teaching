/** Original geometric brand mark; its colors follow the shared theme. */
export default function SiteLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path
        d="M10 27V13l8 8 8-8v14h5"
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
