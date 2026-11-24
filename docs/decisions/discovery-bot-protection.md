# Bot protection for public routes

The maintainer accepts the Vercel Bot Protection challenge for ordinary scripted
HTTP clients across the public site. This includes every public HTML route,
`robots.txt`, `sitemap.xml`, `llms.txt`, and the social preview image. These
clients may receive HTTP 429 and be unable to retrieve the content. The challenge
is intentional. The maintainer confirms that people, intended search crawlers,
and intended AI bots can access the site through their normal clients.

This decision applies while normal visitor and intended crawler access remains
effective. A block affecting those clients requires separate investigation.
