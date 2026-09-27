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

## How it is hosted (and what else would work)

Live on **GitHub Pages**, chosen from three free options, so no decision here is load-bearing:

- **GitHub Pages** ← *in use*. Deploy from branch `main`, path `/`. The push that ships this repo is
  the deploy. Zero configuration, zero cost, zero extra accounts.
- **Cloudflare Pages** — connect the repo, build command empty, output directory `/`.
- **Netlify** — drag the folder in, or connect the repo. No build command.

Do not buy a domain for this. A `github.io` or `pages.dev` URL is enough to satisfy a payment
provider's legitimacy review, and the operating brief says never spend money we do not have.

## It is live

**https://jbaker11131988-ship-it.github.io/quick-turn-launch-pack-website/**

Deployed 2026-09-27 from `main` on GitHub Pages, free tier, no custom domain. The page is this
repository served as-is — there is no build step between the commit and the URL.

| | |
|---|---|
| Repo | `github.com/jbaker11131988-ship-it/quick-turn-launch-pack-website` (public) |
| Pages source | branch `main`, path `/` |
| Cost | $0 |
| Buy button | **degrades to a `mailto:` notice** — `CHECKOUT_URL` is intentionally unset |

### Why the buy button is not a checkout yet

`CHECKOUT_URL` is still empty, and that is the correct state, not an oversight. The Payment Link
built on [QUI-7](/QUI/issues/QUI-7) is a **test-mode** link on an account this run could not confirm
is enabled for charges — its credential now returns `unauthorized`, and the last verified read showed
`charges_enabled: false`. Pointing a live buy button at that link would look like a sale and fail at
the payment step, in front of the buyer. An honest email notice costs one email; a checkout that
breaks trust costs the account. Set it the moment [QUI-7](/QUI/issues/QUI-7) reports a real,
enabled, live-mode link.

### How the push actually happened

Worth recording, because it is the non-obvious part and it cost three heartbeats.

- The board's GitHub **personal access token connection** is installed and `connections_search`
  correctly reports it `ready`. That path serves GitHub *tools* — and this run exposes none.
- The managed `git` / `gh` **broker** is a separate authorization that needs an
  `oauth.access_token` ref *and* a GitHub App tenant with a non-zero installation count. A PAT
  connection supplies neither, so the broker declines with `The managed GitHub identity is
  incomplete` and hands `git` no credential. **`ready` from the connection search does not mean
  `git push` will work.** The `git` wrapper prints that broker warning on every invocation and then
  carries on unauthenticated.
- The fix was to bind the board's existing token to this agent as a secret (`access.github_token`),
  which the board approved. It is fetched on demand into a `600` file in the run's scratch directory
  and read by a scratch credential helper. **The token is not in the remote URL, not in `.git/config`,
  not in any commit, and not in any log line** — the committed remote is a clean anonymous
  `https://github.com/...` URL, so a leaked clone leaks nothing.

To push again, you do not need any of that: the remote is set and tracking is configured.

```bash
git push                 # from this directory
```

To rebuild Pages after a change, nothing is required — the push *is* the deploy.

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
