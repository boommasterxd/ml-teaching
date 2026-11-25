# Inline navigation feedback

## Context

An App Router link can stay pending after activation while Next.js retrieves
the destination. The feedback should identify the link that started the
navigation and leave the current page usable.

## Decision

Show pending navigation feedback on the activated link. Use the shared
[`LinkNavigationContent`](../../src/components/LinkNavigationIndicator.tsx)
through [`IntentLink`](../../src/components/IntentLink.tsx). After 100 ms of
pending navigation, replace the action icon with the shared spinner in the
same slot. For a link without an icon, Animate UI opens and closes the spinner
space before the label so the text moves without scaling. With reduced motion,
the space changes immediately. Prefetch on pointer, keyboard or touch intent
leaves the idle link appearance intact.

## Consequences

The link keeps its label and focus. A visually hidden live region announces
the pending state outside the link's accessible name. The delay avoids a flash
when navigation completes quickly. Training setup uses the same icon slot
with its own pending state. Links from the static 500 document show the same
feedback after activation while the [native recovery flow](../architecture.md)
continues. Fragment links, browser history traversal and external destinations
follow their own browser behavior. Activating a header menu destination whose
complete URL is already current closes the menu and restores focus to its trigger.
Different queries or fragments and modified activations retain native navigation.
