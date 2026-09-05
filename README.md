# thekorealtygroup.com

Static HTML on Vercel, plus one serverless function. No framework, no build step —
Vercel serves the files as they sit in the repo and auto-deploys on push to `main`.

Live: https://thekorealtygroup.com (apex is canonical; `www` 308s to it)

---

## Published guides

| URL | Source |
|---|---|
| `/guides/` | generated index |
| `/guides/mud-pid-lid-texas-what-they-cost.html` | `content/guides/mud-district-cost.md` |
| `/guides/flood-zone-x-x500-ae-galveston-county.html` | `content/guides/flood-zone-x-vs-x500.md` |
| `/guides/hoa-dues-what-they-actually-cover.html` | `content/guides/hoa-dues-what-they-cover.md` |
| `/guides/why-square-footage-doesnt-match.html` | `content/guides/square-footage-doesnt-match.md` |

Guides are the primary traffic driver. Everything else on the site exists to convert
the people they bring in.

## Structure

```
index.html                   Home — principles, preemptive Q&A, guides, markets, tools, capture
closed-from-anywhere.html    Signing-day prep (notary credential, not a service claim)
guides/                      Generated HTML — do not hand-edit, regenerate instead
content/guides/*.md          The actual source. Edit here.
neighborhoods/               South Shore Harbour (template for the rest)
api/contact.js               Serverless function: forms -> GoHighLevel
js/forms.js                  Intercepts form submits, POSTs JSON to /api/contact
css/site.css                 Everything. One stylesheet.
img/guides/<slug>.jpg        Card + article hero (1168x784)
img/guides/<slug>-og.jpg     Social share crop (1200x630)
sitemap.xml                  Update when a page is added
```

## Publishing a new guide

1. Write markdown into `content/guides/`. Frontmatter needs `title`, `slug`,
   `description`, `date`, `author`, `category`.
2. Drop a 1168x784 hero at `img/guides/<slug>.jpg` and a 1200x630 crop at
   `img/guides/<slug>-og.jpg`.
3. Regenerate the HTML, add the URL to `sitemap.xml`, and add a card to the
   guides block on `index.html`.

The generated pages carry Article schema, canonical URL, per-guide og:image, a
capture form tagged with the guide slug, and two cross-links to related guides.

## Forms → GoHighLevel

Seven forms POST JSON to `/api/contact`. The function maps whatever the inputs were
named, upserts the contact tagged `website-lead`, writes the address and form details
as a note, and opens an opportunity.

**Required env vars** (Production + Preview, on the `thekorealtygroup` project):

| Var | Value |
|---|---|
| `GHL_API_KEY` | Private Integration token |
| `GHL_LOCATION_ID` | sub-account location id |
| `GHL_PIPELINE` | optional — defaults to `KO Website Leads` |
| `GHL_STAGE` | optional — defaults to `New Lead` |

Env vars only reach deployments created *after* they're saved. If a form returns
"Server not configured," redeploy before debugging anything else.

**Test it live** — browser console on thekorealtygroup.com:

```js
fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Lead', email: 'test@example.com',
                         phone: '2815550100', message: 'testing the pipe' })
}).then(r => r.json()).then(console.log)
```

`{ok: true}` means it worked. Check GHL for the contact, the `website-lead` tag, and
a card in New Lead, then delete the test contact.

A `GET /api/contact` returns **405**, not 404. A 404 means the function didn't deploy.

Failure behaviour, by design: a missing or renamed pipeline still saves the lead and
logs a warning. A filled honeypot returns success without calling the API. Upstream
errors never reach the browser — the visitor sees the phone number.

## Compliance

TREC notices in every footer at 10.5pt (the rule is 10pt minimum), linked to the
HAR-hosted Consumer Protection Notice and the completed IABS for license #616346.
Both must stay on every page. Broker is The Sears Group, TREC #9008344.

School districts are stated at address level, never per neighborhood — League City
is served by both Clear Creek ISD and Dickinson ISD.

## Still open

- **Proof**: no testimonials, no closed-transaction count, no headshot. Nothing was
  invented; these need real inputs.
- **Google Search Console**: not verified, sitemap not submitted.
- **Vercel Web Analytics**: scripts are deployed, dashboard toggle is off.
- **Neighborhood pages**: only South Shore Harbour exists. The other six market cards
  on the home page route to the HAR MLS search rather than 404.
- **City sections** (`/league-city/`, `/pearland/`, …) — planned, not built.
- The HOA and square-footage guides say "a house I recently listed." Move to past
  tense when 110 Cloudbridge closes.
