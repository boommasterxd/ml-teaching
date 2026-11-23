# Local Lighthouse performance audits

The project runs Lighthouse against a local native production build. On shared
GitHub-hosted runners, changes in browser main-thread timing can move identical
code across the score threshold. The pull-request gate therefore relies on the
production build and Playwright for browser verification, including accessibility
and keyboard behavior, and leaves Lighthouse scores to local audits.

Use [the local Lighthouse command](../development.md#checks) for performance
work. Each audited route must score above 95 on mobile and desktop. Run the tool
on comparable hardware and browser profiles when evaluating a change.
