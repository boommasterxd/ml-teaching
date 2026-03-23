/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion';
import { Link } from 'react-router-dom';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useFocusTrap(isVisible);

  useEffect(() => {
    const hasAcknowledged = localStorage.getItem('cookie_consent_acknowledged');
    if (!hasAcknowledged) {
      setIsVisible(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem('cookie_consent_acknowledged', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={bannerRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-label="Cookie-Informationen"
          className="fixed bottom-6 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl z-50 p-6 md:p-8 bg-[#121212] text-white shadow-2xl rounded-3xl border border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
            <div className="text-sm md:text-base text-gray-300 leading-relaxed">
              <p>
                Wir verwenden nur technisch notwendige Cookies und lokale Speichertechnologien, um die Funktionalität dieser Website zu gewährleisten. 
                Es werden keine Tracking-Cookies verwendet. Weitere Informationen finden Sie in unserer{' '}
                <Link 
                  to="/datenschutz" 
                  className="underline hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] rounded-sm"
                >
                  Datenschutzerklärung
                </Link>.
              </p>
            </div>
            <button
              onClick={handleAcknowledge}
              className="w-full md:w-auto px-8 py-3 bg-white hover:bg-gray-200 text-black font-semibold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              Verstanden
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
