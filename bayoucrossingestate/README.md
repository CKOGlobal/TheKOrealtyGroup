# bayoucrossingestate.com

Single-listing microsite for **103 Avenue L, Dickinson, TX 77539**: MLS #78441036, offered at
$3,400,000. Same pattern as `436oldorchard` and `110cloudbridge`: one `index.html` with its CSS
and JS inline, no build step, Vercel + Spaceship domain, **retire after closing**.

One difference from those sites: this one has a serverless function, `api/ask.js`, for the
on-site assistant.

- Repo: `CKOGlobal/bayoucrossingestate` (private), still to be created. Until it exists, this
  folder is staged inside `CKOGlobal/TheKOrealtyGroup` and excluded from that site's deploy by
  `.vercelignore`.
- Vercel project: `bayoucrossingestate` on **ckoglobal's projects**
- Domain: `bayoucrossingestate.com`, registered at **Spaceship** 11/09/2026, auto-renew on
- Listing agent: Kelli Owens, Texas sales agent #616346
- Broker: The Sears Group, Christopher Sears, TREC #9008344

---

## 1. Adding photographs (the routine job)

Photos are driven by `gallery.json`. Nothing in `index.html` needs editing.

1. GitHub → `img` folder → **Add file → Upload files** → commit to `main`.
2. Open `gallery.json` → pencil icon → add one entry per photo → commit.

```json
{ "file": "aerial-01.jpg", "category": "Aerials", "alt": "Aerial looking north over the pond to the tree line along Dickinson Bayou", "caption": "From above the pond, facing the bayou" }
```

| Field | Required | What it does |
|---|---|---|
| `file` | yes | Filename inside `img/` |
| `category` | yes | One of: `Aerials`, `Arrival`, `Grounds`, `Kitchen`, `Living`, `Primary Suite`, `Upstairs`, `Detached Suite`. Anything else is ignored. |
| `alt` | yes | **Real description of what is in the frame.** Entries without alt text are skipped on purpose. |
| `caption` | no | Shown under the photo and in the viewer |
| `chapter` | no | `gate`, `drive`, `bridge` or `house`. Places the photo full-bleed in that step of the arrival sequence. |
| `hero` | no | `true` on exactly one photo: the opening full-screen image |
| `wide` | no | `true` to span the full gallery row |
| `width`, `height` | no | Pixel size; prevents layout shift |

The page leads with aerials and the arrival sequence. The first three `Aerials` sit beside the 3D
tour, so a remote buyer can judge the setting before driving down. Gallery order is category order
(the list above), then file order within `gallery.json`.

Until photos exist, the hero shows a dark field with fine water lines, the arrival chapters are
text-only, and the aerial and gallery slots say photography is to follow. Nothing appears broken.

Aim for about 2,400 px on the long edge for aerials and the hero, 2,000 px for the rest, 300–500 KB
each, EXIF stripped. **Check the hero and the aerials on a phone** before calling it done.

## 2. The 3D tour

`#tour` embeds the Zillow 3D Home tour. The iframe loads only on click, so no third-party request is
made until someone asks for it. The URL appears **twice** in `index.html`: the `TOUR` constant in the
script, and the fallback link under the tour. Change both or neither.

## 3. The on-site assistant (`api/ask.js`)

The **Ask or contact Kelli** button (bottom right, every screen) is the page's one persistent
contact affordance. It opens Call / Text / Email plus a question box.

**How it stays honest:**

- `api/facts.js` is the only thing the model is allowed to know. Edit facts there.
- **Price/terms, flood, taxes, and neighborhood/school questions never reach the model.** They
  are pattern-matched in `api/ask.js` and answered with fixed, pre-approved text that states
  the disclosed facts and routes to Kelli. That makes a guarantee, where a system prompt only
  makes a request.
- Everything else goes to Claude with a facts-only system prompt. The reply is also filtered for
  "master" and "walk to" before it is returned.
- With no API key set, the routed topics still answer and everything else says "please reach
  Kelli."

**Env var** (Production + Preview, project `bayoucrossingestate`):

| Var | Value |
|---|---|
| `ANTHROPIC_API_KEY` | An Anthropic API key. Set a monthly spend limit on it in the Anthropic Console. |

Env vars reach only deployments created *after* they are saved, so redeploy after adding it.

**Test it live**, in the browser console on the site:

```js
fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({messages:[{role:'user',content:'What is upstairs?'}]})}).then(r=>r.json()).then(console.log)
```

A `GET /api/ask` returns **405**. A 404 means the function did not deploy.

## 4. Compliance

`npm run check` (or `node scripts/compliance-check.mjs`) fails if the page or facts sheet:

- uses "master" (use **primary**) or "walk to" / "walking distance"
- states the bedroom count or the house's square footage in prose (Particulars table only)
- uses language describing who the area or home is for
- loses the body-text Zone AE disclosure
- renders the TREC links smaller than 14px

The flood status is in the body, three times: the Answers section, The Details, and Particulars.
Never move it to the footer.

The footer carries the agent and broker block, the tagline, and the HAR-hosted TREC Consumer
Protection Notice and IABS links at 15px. Do not shrink them.

## 5. Guides on the main site

The Details and Answers sections link to three guides on **thekorealtygroup.com** (not here, since
this domain retires):

- `/guides/flood-zone-ae-elevation-certificate-freeboard.html`
- `/guides/well-and-septic-texas-acreage.html`
- `/guides/ag-exemption-rollback-taxes-texas-acreage.html`

## 6. DNS at Spaceship

Apex is canonical; `www` 308-redirects to apex. That is set in Vercel → Project → Domains, and
`vercel.json` also carries the redirect.

| Type | Host | Value |
|---|---|---|
| A | `@` | **the IP on the Vercel domain card** for this project |
| CNAME | `www` | **the target on the Vercel domain card** for this project |

Take both values from Vercel → Project → Settings → Domains after adding the domain, not from this
README. Newer projects are issued an apex IP from a pool (436oldorchard got `216.150.1.1`), and
Vercel verifies against its own card. Delete the parked A records Spaceship created at purchase.
A few minutes of `ERR_CONNECTION_CLOSED` right after the records go in is SSL being issued: wait.

## 7. Open items

- Photography. Then add `img/og-cover.jpg` (1200x630) and uncomment the `og:image` tag.
- `ANTHROPIC_API_KEY` in Vercel.
- GTM container ID: `GTM-XXXXXXX` is the same placeholder used on the other listing sites.

## Retiring the site

When the property closes, delete the Vercel project, remove the domain or let it lapse, and archive
this repo. Rotate or revoke the Anthropic key used here. The guides stay on thekorealtygroup.com;
move their "my current listing" lines to past tense.
