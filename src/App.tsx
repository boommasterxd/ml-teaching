/**
 * Root application component. Configures React Router with lazy-loaded pages,
 * a global loading fallback, skip-to-content link, and the site footer.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const ImprintPage = lazy(() => import('./pages/ImprintPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

/** Full-screen spinner shown while a lazy-loaded page chunk is being fetched. */
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-200 border-t-red-600"></div>
  </div>
);

/** Renders the router, skip link, main content area, and footer. */
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <a
            href="#main-content"
            className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:bg-white focus-visible:text-zinc-900 focus-visible:px-4 focus-visible:py-2 focus-visible:rounded-lg focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Zum Hauptinhalt springen
          </a>
          <main id="main-content" className="flex-grow">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/lernen" element={<TrainingPage />} />
                <Route path="/impressum" element={<ImprintPage />} />
                <Route path="/datenschutz" element={<PrivacyPage />} />
                <Route path="/barrierefreiheit" element={<AccessibilityPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
