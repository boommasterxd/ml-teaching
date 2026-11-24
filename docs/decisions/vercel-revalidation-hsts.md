# HSTS on the Vercel homepage revalidation response

The maintainer accepts SETUP-02 as intended Vercel behavior. Vercel's conditional
HTTPS GET for the homepage can return HTTP 304 without a
`Strict-Transport-Security` header. A browser retains any previously learned HSTS
policy until its existing expiry. The 304 response does not extend that period.

Keep the full policy in `next.config.mjs` for fresh application responses and
hosted HTTPS redirects. This acceptance applies only to the homepage's
provider-handled 304 revalidation response.

[RFC 6797, section 8.6](https://datatracker.ietf.org/doc/html/rfc6797#section-8.6)
