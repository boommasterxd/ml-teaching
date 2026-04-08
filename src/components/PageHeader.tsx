/**
 * PageHeader.tsx
 *
 * Sticky page header component with a back-navigation button, centered logo and title,
 * and an optional right-side action slot.
 */
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  /** Page title displayed in the center of the header. */
  title: string;
  /** Optional slot rendered on the right side of the header (e.g. action buttons). */
  rightSlot?: ReactNode;
}

/**
 * Renders a sticky header bar with a back button, a brain icon, the page title,
 * and an optional right-side action area.
 *
 * When `rightSlot` is omitted, an invisible spacer of equal width is rendered
 * on the right to keep the title visually centered.
 */
export default function PageHeader({ title, rightSlot }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-zinc-600 hover:text-zinc-900 transition-colors font-medium text-sm flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
          aria-label="Zurück zur Startseite"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Zurück</span>
        </button>

        <div className={`flex-1 flex items-center justify-center gap-3 ${rightSlot ? 'px-2' : 'pr-8 sm:pr-0'}`}>
          <img
            src="/brain.webp"
            srcSet="/brain-48.webp 48w, /brain-96.webp 96w"
            sizes="32px"
            alt=""
            aria-hidden="true"
            className="h-8 w-8 object-contain hidden lg:block"
            width="32"
            height="32"
          />
          <span className="text-base sm:text-lg font-bold text-zinc-800 line-clamp-1">{title}</span>
        </div>

        {/* Spacer mirrors the back button width to keep the title centered when no rightSlot is provided. */}
        {rightSlot ?? <div className="w-10 sm:w-20" aria-hidden="true"></div>}
      </div>
    </header>
  );
}
