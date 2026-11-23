# Bot protection for public discovery resources

The maintainer accepts the Vercel Bot Protection challenge for ordinary automated
HTTP clients requesting `robots.txt`, `sitemap.xml`, `llms.txt`, or the social
preview image. These clients can receive HTTP 429 and may be unable to retrieve
those resources. The challenge is intentional, and the maintainer confirms that
the intended crawlers are exempt.

This decision applies while those crawler exemptions remain effective. A block
affecting an intended exempt crawler requires separate investigation.
