/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TrainingPage from './pages/TrainingPage';
import ImprintPage from './pages/ImprintPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-white focus:text-red-600 focus:border-2 focus:border-red-600 focus:rounded-full focus:font-bold focus:shadow-xl transition-all"
        >
          Zum Inhalt springen
        </a>
        <main id="main-content" className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/lernen" element={<TrainingPage />} />
            <Route path="/impressum" element={<ImprintPage />} />
            <Route path="/datenschutz" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <CookieBanner />
      </div>
    </Router>
  );
}
