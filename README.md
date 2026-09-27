# Launch Pack — website

The sales surface for the [Launch Pack](/root/companies/quick-turn/shared/first-offer.md) offer:
one page, no build step, no dependencies, no cost to host.

Owned by Dara Voss · task [QUI-9](/QUI/issues/QUI-9) · offer defined in
[`../shared/first-offer.md`](../shared/first-offer.md), copy in
[`../dara/listing.md`](../dara/listing.md).

## Why it is built this way

This is a zero-capital company. Every technical decision follows from that:

- **No build step, no framework, no package manager.** One `index.html` you can read end to end.
  Nothing to break, nothing to upgrade, no supply chain, no cost.
- **No external requests.** No CDN, no web fonts, no analytics, no third-party script. The page makes
  zero network requests after the initial load. A privacy-compliance product whose own website phones
  home to five vendors would be indefisible in front of exactly the buyer it is aimed at, and the footer
  says so out loud.
- **Fails safe when unconfigured.** The buy button does not point at a dead link and does not pretend
  to take money. It explains that checkout is not open and routes the buyer to email. See below.
- **No tracking, so there is no cookie banner to ship.** Nothing to consent to, nothing to disclose in
  the privacy policy we sell.

## Set the two URLs

Open `index.html`, find the `CONFIG` block in the `<script>` at the bottom, and set:

| Constant | What it is |
|---|---|
| `CHECKOUT_URL` | Your Stripe Payment Link, `https://buy.stripe.com/...` |
| `INTAKE_URL`   | Where the buyer sends their stack. An intake form URL or a `mailto:` address |
| `CONTACT`      | Fallback address when neither is set. Currently `hello@REPLACE-WITH-YOUR-DOMAIN` |

Those are the only values. Nothing else needs editing, in any order, and the site works with all three
unset — the buttons just explain themselves.

`../shared/intake-form.html` uses the same convention with its `TO` constant, so there is one habit:
a single value near the top of a script block, and a runtime check that refuses to pretend.

**Until `CHECKOUT_URL` is set, do not advertise the site as a checkout.** It is a live, honest landing
page that routes to email. The Stripe link is tracked in [QUI-7](/QUI/issues/QUI-7).

## Deploy it for $0

Any static host works, and all of these are free on a hobby tier, so no decision here is load-bearing:

- **GitHub Pages** — Settings → Pages → deploy from branch, root. The push that ships this repo is
  the deploy. Zero configuration, zero cost, zero extra accounts.
- **Cloudflare Pages** — connect the repo, build command empty, output directory `/`.
- **Netlify** — drag the folder in, or connect the repo. No build command.

Do not buy a domain for this. A `github.io` or `pages.dev` URL is enough to satisfy a payment
provider's legitimacy review, and the operating brief says never spend money we do not have.

## Verify after any edit

```bash
# behaviour: the three config states, and that the buy button never dead-links
node test-config.mjs

# no external network references, and the config constants are present
grep -oE '(src|href)="https?://[^"]*"' index.html   # expect: no output
grep -n 'CHECKOUT_URL\|INTAKE_URL\|CONTACT' index.html

# opens locally, no server needed
python3 -m http.server 8000 --directory .
```

`test-config.mjs` loads the real `<script>` out of `index.html` and runs it against a minimal fake
DOM, so it tests the shipped code rather than a copy. It uses only `node:vm` and `node:fs` — no
dependencies, no install step. It exists because the fail-safe is the part of this page that can
silently break: if someone pastes a `CHECKOUT_URL` badly, the buy button must degrade to email
rather than to a dead link or a fake checkout.

Open it and check three things: the buy button resolves to a URL or a `mailto:`, the notice block
appears only when `CHECKOUT_URL` is unset, and the page is readable with JavaScript disabled
(all content is in the HTML; the script only rewrites button targets).

## Licensing

No licence is granted. This repository and its contents are proprietary to Quick Turn. Do not add an
open-source licence file without board approval — that is an irreversible grant of rights and not a
decision this task should make.
