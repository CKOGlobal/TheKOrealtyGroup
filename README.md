# thekorealtygroup.com

Static site. No framework, no build step. Deploy on Vercel; it serves files as-is.

## Structure

```
index.html                              Home
closed-from-anywhere.html               Remote online notary (the differentiator page)
neighborhoods/south-shore-harbour.html  Neighborhood template — copy this for the rest
css/site.css                            Shared stylesheet (all pages)
img/globe.mp4                           Globe animation, used on home + notary pages
```

## Before launch — required

1. **Forms do nothing.** Every `<form action="#">` needs a real endpoint.
   Formspree/Basin is the 5-minute option; a CRM webhook is better. Search `TODO(kelli)`.
2. **`/img/og-cover.jpg`** — 1200x630 share image. Referenced by every page, doesn't exist yet.
3. **Notary fee line** on closed-from-anywhere.html. Texas caps RON at $25/notarial act —
   confirm the current cap before publishing any price.
4. **Broker review.** The Sears Group should approve the TREC disclosure block in the footer.

## Still to build

- Neighborhood pages: tuscan-lakes, mar-bella, victory-lakes, magnolia-creek, clear-creek-village
  (home page already links to all five — they 404 until built)
- about.html — bio, book, headshot, testimonials
- Testimonials block (deliberately omitted; nothing was invented)

## Phase two

IDX/MLS integration once Sears Group approves a feed. Everything here stays.
