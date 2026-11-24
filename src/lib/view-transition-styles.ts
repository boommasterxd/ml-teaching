// Keep the same build-known bytes on every App Router document. Its CSP also
// applies when client navigation enables the rule on the homepage.
export const ERROR_RECOVERY_STYLES = `
@view-transition { navigation: auto; types: error-recovery; }
:root:active-view-transition-type(error-recovery) { view-transition-name: none; }
:root:active-view-transition-type(error-recovery)::view-transition { pointer-events: none; }
:root:active-view-transition-type(error-recovery) #main-content { view-transition-name: error-recovery-content; }
::view-transition-group(error-recovery-content) { animation: none; }
::view-transition-old(error-recovery-content) { animation: error-recovery-out 100ms ease-out both; }
::view-transition-new(error-recovery-content) { animation: error-recovery-in 120ms ease-out both; }
@keyframes error-recovery-out { to { opacity: 0; } }
@keyframes error-recovery-in { from { opacity: 0; } }
`;

// Exact trusted bytes emitted by Motion's AnimateView reset hook, also hashed during SSG.
export const VIEW_TRANSITION_RESET = `
    ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
        animation-timing-function: linear !important;
    }
    `;
