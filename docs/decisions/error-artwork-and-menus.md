# Error artwork and deferred menus

## Shader playback

The homepage, static 404 and 500 pages and App Router recovery screen share the
WebGL renderer and playback lifecycle. The initial headings and recovery links
stay available while the renderer starts or falls back to the responsive still.
Sharing the lifecycle keeps motion preferences and resource handling consistent
across the scenes. See [glass artwork playback](../design-system.md#glass-artwork-playback)
for the current startup, fallback and resume rules.

## Deferred menus

The header serves its navigation controls and appearance switch in the initial
HTML and shares one module for the full popups. This keeps first paint and focus
independent of popup startup. See [header menu loading](../design-system.md#header-menu-loading)
for preparation and pending opening behavior.

The mobile legal menu prepares its own content on intent and opens on explicit
activation. The shared pending dismissal supports Escape and outside activation.
Each menu provides loading feedback and allows retry after a failed download.
Base UI owns the loaded popups and Animate UI owns entry and exit motion.
