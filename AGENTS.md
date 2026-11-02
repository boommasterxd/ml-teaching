# Repository instructions

## Node.js Runtime

- Use the newest officially released Node.js LTS as the supported application runtime. The reviewed baseline on 2026-11-02 is Node.js 26.x (26.13.0).
- When the newest released LTS changes, review the official release schedule and published releases, then update and verify the runtime selectors and constraints together: package engine, CI versions, Node.js type declarations, containers, and any deployment-provider runtime setting used by the project.
- Treat exact versions and major-version constraints as the current reviewed baseline, not permanent exceptions. Reassess and advance them with each reviewed LTS upgrade; do not use a floating `lts/*` selector to bypass that review.

## Documentation Index

| Document | Purpose |
|---|---|
