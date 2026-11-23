# ESLint peer compatibility

The maintainer accepts the current `QUALITY-01` and `SETUP-01` findings until a
compatible solution is available. ESLint 10 is outside the peer ranges declared
by the `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and
`eslint-plugin-react` versions used by `eslint-config-next`.

Keep the existing toolchain while this decision applies. The lint gate remains
blocking. npm reports an invalid peer tree, and the three plugins do not declare
support for this ESLint major. Reassess this decision when an available
combination can satisfy the peer ranges and preserve the required lint rules.
