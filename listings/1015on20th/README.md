# 1015on20th.com

Single-property listing website for **1015 20th Street, Galveston, TX 77550**, marketed by
Kelli Owens, The KO Realty Group / The Sears Group. Seeded from the
[110cloudbridge](https://github.com/CKOGlobal/110cloudbridge) listing-site template: one
`index.html` with all CSS inline, an `img/` folder, the seller's disclosure PDF, and
`vercel.json`. No framework, no build step, no dependencies. Vercel serves the files exactly
as they sit in this repo.

## What is still open

Search `index.html` for `TODO(kelli)`. Every number that has not been supplied (price,
recorded square footage, lot, year built, tax rate, flood zone, windstorm certificate, STR
status, historic district, parking, HOA, MLS #) is a placeholder rendered as *Pending* with a
comment beside it saying exactly what to paste in. Nothing on the page is invented.

Also open: an exterior photo for the hero (`img/01-front.jpg`) and the share image
(`img/og-cover.jpg`, 1200x630), the 3D tour URL, floor plan images and PDF, and
`sellers-disclosure.pdf`.

## Contact form

The form posts JSON to `/api/contact`. `vercel.json` rewrites that path to
`https://thekorealtygroup.com/api/contact`, which already handles the `website` honeypot and
tags the lead with `source=1015on20th`. This repo therefore needs no serverless function and
no environment variables.

## How to edit

Open `index.html` here in the GitHub web UI, click the pencil icon, make your change, and
commit to `main`. Vercel watches this branch and redeploys automatically. Photo captions live
in the `PHOTOS` array near the bottom of `index.html`; the photo count in the heading and the
"See all" button update themselves from that array.

## How to roll back

In Vercel, open the project → **Deployments**, find the last good deployment, and use
**Instant Rollback**. To undo the change in Git as well, open the bad commit here on GitHub,
click **Revert**, and commit the revert to `main`.

## Retiring the site

When the property closes, delete the Vercel project and archive or delete this repo. The
seller's disclosure PDF should not remain at a public URL after the transaction ends.
