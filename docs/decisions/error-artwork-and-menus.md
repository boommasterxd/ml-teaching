# Error artwork and deferred menus

## Shader playback

The homepage, static 404 and 500 pages and App Router recovery screen share the
WebGL renderer and playback lifecycle. Playback starts after the initial paint when the artwork
and document are visible and the visitor allows motion. On the native 500 page,
automatic startup also waits for document load and an idle opportunity when the
browser supports it. Pointer and keyboard intent can start it sooner. The 404
uses glass digits and the 500 uses the glass ring.

Pausing or scrolling the artwork out of view stops drawing and keeps one bounded
canvas so playback can resume at the same animation time. Page exit, a hidden
tab, reduced motion and context loss release the renderer. Reduced motion,
disabled scripting and unavailable WebGL use an optimized responsive still.
The worker verifies WebGL support before loading its shader renderer.

The homepage reserves the artwork area and tries the shader first at all viewport
sizes when scripting and motion are available. A first frame within 500 ms fades
into the empty artwork area. After 500 ms of active waiting for
the first frame, it requests the responsive still and shows a spinner. Once the
still decodes, it replaces the spinner while the renderer continues. An earlier
renderer failure requests the still immediately.

The static error pages preload the matching still on narrow screens. On wider
screens they load it on demand, and the App Router recovery screen starts with
its still. Error artwork shows a spinner after 500 ms of active waiting. A
renderer failure or a first frame still pending after two active seconds ends
waiting and selects the still on all of these screens and the homepage.
Pausing before the first frame displays the still until playback draws a frame.
Headings and return links are available in the initial render independently of
shader startup.

## Deferred menus

The header serves its navigation controls and appearance switch in the initial
HTML. On a device with a coarse pointer, the header prepares one shared module
after hydration so a first tap can reuse it. Other devices prepare it on
pointer or focus intent. The module contains the full navigation and appearance
popups, which mount on demand. A pending navigation opening carries focus
to the corresponding interactive trigger. The appearance button and chevron
stay mounted and anchor the loaded popup.

The mobile legal menu prepares its own content on intent and opens on explicit
activation. The shared pending dismissal supports Escape and outside activation.
Each menu provides loading feedback and allows retry after a failed download.
Base UI owns the loaded popups and Animate UI owns entry and exit motion.
