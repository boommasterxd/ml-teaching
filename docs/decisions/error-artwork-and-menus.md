# Error artwork and deferred menus

## Shader playback

The homepage and static 404 and 500 pages share the WebGL renderer and playback
lifecycle. Playback starts automatically after the initial paint when the artwork
and document are visible and the visitor allows motion. Pointer and keyboard
intent can prepare the renderer earlier. The 404 uses glass digits and the 500
uses the glass ring.

Pausing or scrolling the artwork out of view stops drawing and keeps one bounded
canvas so playback can resume at the same animation time. Page exit, a hidden
tab, reduced motion and context loss release the renderer. Reduced motion,
disabled scripting and unavailable WebGL use an optimized responsive still.
Headings and return links are available in the initial HTML, independently of
shader startup. The in-app recovery screen shows its poster while playback loads.

## Deferred menus

The mobile legal menu and appearance menu share module loading, retry feedback
and dismissal while the popup loads. Each trigger keeps its focus and press
feedback during preparation. Intent prepares the module and explicit activation
opens the popup. Once mounted, the Animate UI menus own focus and exit behavior.
