# Error artwork and deferred menus

## Shader playback

The homepage, static 404 and 500 pages and App Router recovery screen share the
WebGL renderer and playback lifecycle. Playback starts after the initial paint when the artwork
and document are visible and the visitor allows motion. Pointer and keyboard
intent can prepare the renderer earlier. The 404 uses glass digits and the 500
uses the glass ring.

Pausing or scrolling the artwork out of view stops drawing and keeps one bounded
canvas so playback can resume at the same animation time. Page exit, a hidden
tab, reduced motion and context loss release the renderer. Reduced motion,
disabled scripting and unavailable WebGL use an optimized responsive still.
During ordinary startup the artwork reserves its space without requesting that
still. A spinner appears after 500 ms of active waiting. If the first frame
is still pending after two active seconds, the scene switches to the still.
Headings and return links are available in the initial render independently of
shader startup.

## Deferred menus

The mobile legal menu and appearance menu share module loading, retry feedback
and dismissal while the popup loads. Each trigger keeps its focus and press
feedback during preparation. Intent prepares the content module. The mobile legal
menu opens on explicit activation. The appearance menu also supports mouse hover
through its Base UI trigger. Its chevron stays mounted during loading, with a
separate spinner for pending feedback. Animate UI owns popup entry and exit.
