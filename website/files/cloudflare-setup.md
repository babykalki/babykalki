# Cloudflare setup — domain, tunnel, hostnames, Access (private by default)
v1.0 (20 Nov 2026: unchanged since v0.7; v0.7: unchanged except the website checklist below; v0.6: your own website on the public hostname — no Cloudflare change; v0.5 19 Nov: + the founder-only approvals page `/bk-approve`, step 4b; v0.4 19 Nov; v0.3 18 Nov). Steps 2 (Access) and 3 (tunnel) were followed on a test domain in the 19 Nov 2026 dry run; the browser login in step 4 passed in the founder's own use (19 Nov 2026). Menu names change; if a step does not match, search Cloudflare's docs for the step's title.

## 1. Domain
1. Create a Cloudflare account (free plan). Turn on 2-factor login for the account.
2. Domain Registration > Register: pick a name. Cloudflare charges the registry price (a .com was $10.46/yr on 17 Nov 2026).
   Note: **.in is not on Cloudflare Registrar's list** (checked 17 Nov 2026). For .in, buy it at an Indian registrar and
   add it to Cloudflare as a site (change the nameservers to Cloudflare's) — tunnels and Access then work the same.

## 2. Access first (so nothing is ever open, even for a minute)
1. Zero Trust (free plan, up to 50 users) > Settings: choose a team name.
2. Integrations > Identity providers > Add: **One-time PIN** (email code) and/or **Google**.
   New Zero Trust organisations no longer add one-time PIN automatically — add it yourself. (Confirmed 19 Nov 2026: an
   organisation that already existed had no One-time PIN either — check the list even if you made it long ago.)
3. Access > Applications > Add > Self-hosted:
   - Name: `BabyKalki private`. Domain: `agent.<your-domain>` — or the name you put in `BK_AGENT_HOST` (no path — the whole hostname, so `/bk-login` is covered too).
   - Policy: Allow — Include — Emails — `<your email>` (only you). Session duration: 24 h.
4. Check: open `https://agent.<your-domain>` and `https://agent.<your-domain>/bk-login` in a private window → you must
   see the Cloudflare login page, not an error and not dsh.

## 3. Tunnel (outbound only — no open ports on the server)
1. Zero Trust > Networks > Tunnels > Create a tunnel > Cloudflared. Name: `babykalki`.
2. Copy the **token** shown for "run with a token". Paste it ONLY into Nimbuz > Secrets as `TUNNEL_TOKEN`.
   Note: anyone with your Nimbuz login can read every Nimbuz Secret back in plain text (the Nimbuz API returns them,
   checked 18 Nov 2026). Your Nimbuz login is therefore the master key: 2-factor on, and never give it to a citizen.
3. Public hostnames (routes) for that tunnel — **order matters: the path rule goes ABOVE the plain agent rule**.
   The names are yours to choose: if `agent.` is already taken, use another name (e.g. `bk-private.`) for BOTH agent rows,
   protect THAT name with the Access app, and set `BK_AGENT_HOST=<that name>` in Nimbuz's Environment Variables (default
   `agent.<BK_DOMAIN>`). The status page can be any hostname (`www.`, `status.`, `bk.` …) — nothing in the files depends on it.
   | Hostname | Path | Service | Notes |
   |---|---|---|---|
   | `agent.<your-domain>` | `^/(bk-login\|bk-approve(/.*)?)$` | `http://127.0.0.1:8081` | one-shot dsh login link helper AND (v0.5) the founder-only approvals page `/bk-approve` (+ `/bk-approve/decide`). Behind the same Access app. If you already had `^/bk-login$`, EDIT that row's path to this one — do not add a second row. (In the dashboard the `\|` is a plain `|`.) |
   | `agent.<your-domain>` | (empty) | `http://127.0.0.1:3080` | dsh web UI. Protected by the Access app above. Keep the original Host header (default). |
   | `www.<your-domain>` | (empty) | `http://127.0.0.1:8080` | public status page (fixed template, counts only) — or, v0.6, your own website from `site/www/` with the status page at `/status/`. Public on purpose. |
   | `hooks.<your-domain>` | `^/whatsapp$` | (later) | ONLY if you add WhatsApp: the webhook must be public (Meta calls it), so it is NOT behind Access; every request must carry a valid `X-Hub-Signature-256` made with your app secret. The bridge that receives it is **not in the v0.4 files**. Meta business verification usually takes longer than a weekend — start with Telegram. |
4. Check: Nimbuz logs show `[tunnel] ... Registered tunnel connection` (four connections is normal). Nimbuz logs run
   20–50 s behind real time, and the Nimbuz `status` field may say STARTING for ever — trust the logs and the status page.
   (Checked from Nimbuz: a quick tunnel on 18 Nov 2026 and a named tunnel on 19 Nov 2026 — 4 QUIC connections.)

## 4. The second lock (dsh's own login)
1. After every dsh restart, the supervisor keeps dsh's one-time login link in a private file — it is **never written to a log**.
2. Open `https://agent.<your-domain>/bk-login` (Cloudflare login first). It shows the link ONCE, then answers "Gone".
3. Open the link: dsh swaps the token for a signed cookie (up to 30 days). The cookie should survive container restarts
   because dsh's state in /data/dsh is backed up (to verify: the browser login was not part of the 19 Nov dry run).
4. If `/bk-login` says "Cloudflare Access is not protecting this address", fix step 2 before going further.
5. `/bk-login` also refuses Cloudflare Access **service tokens** (403) — they carry no email, so there is no person to
   hand the link to. That is by design: do NOT "fix" it with a Bypass rule. (Checked 19 Nov 2026: Access sign-in page
   for a visitor with no login; dsh's own 401 behind Access; 403 on /bk-login for a service token.)

## 4b. Approvals — only you (v0.5)
Citizens can only ASK for an approval (`request_approval` stores the exact text). You decide on
`https://agent.<your-domain>/bk-approve`: it lists every waiting request with its FULL text and two buttons, Approve / Reject.
1. Nimbuz > Environment Variables: `BK_FOUNDER_EMAILS=<the email you sign in to Cloudflare Access with>` (comma-separated
   if two founders). Empty = the page refuses everyone, so nothing can be approved (the log says so at start).
2. The tunnel route above must include `bk-approve` (step 3). Check: open `/bk-approve` → after the Cloudflare login it says
   "Nothing is waiting for you" (or lists requests).
3. What makes it founder-only (all must hold, else 403): the request came through cloudflared (the page checks that the
   connection belongs to the infra user, so a citizen's shell calling 127.0.0.1 with a made-up header is refused);
   Cloudflare Access signed in a PERSON (an Access **service token** is refused); that person's email is in
   `BK_FOUNDER_EMAILS`; and the button carries a one-hour CSRF token made by the page itself. The decision goes straight to
   the Library's admin port — no citizen holds that key. (Unit- and supervisor-tested 19 Nov 2026; not yet clicked live.)
4. Read the whole text before you press Approve: approving means exactly that text (its SHA-256 is recorded), nothing else.

## 5. Backups bucket
1. R2 > Create bucket `babykalki-backups` (free tier: 10 GB-month). Cloudflare asks you to turn R2 on with a payment
   card before the first bucket, even on the free tier (Cloudflare docs; not re-checked live). Real R2 is still **to
   verify** — the 19 Nov 2026 dry run used an S3-compatible MinIO bucket instead. `BK_REMOTE=r2:<bucket>/<folder>` (a
   folder inside the bucket) works: a fresh start on an empty path was verified.
2. R2 > Manage API tokens > Create: **Object Read & Write**, limited to that ONE bucket.
3. Put the key id and secret into Nimbuz Secrets as `RCLONE_CONFIG_R2_ACCESS_KEY_ID` / `RCLONE_CONFIG_R2_SECRET_ACCESS_KEY`,
   and set `RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true` (a bucket-scoped token may not check or create buckets; without this
   rclone answers AccessDenied).
4. Check: the container's status page shows "Off-site backup: OK" within one backup interval (set
   `BK_BACKUP_EVERY_MIN=5` on Nimbuz), and R2 shows `snapshots/snap-…/COMPLETE` and `lease.json`.
5. `lease.json` says which copy of BabyKalki is the writer. During a Nimbuz restart the new copy shows
   WAITING_FOR_LEASE for up to a minute while the old copy writes its final snapshot — that is normal. Never delete
   `lease.json` while BabyKalki runs; if a crashed copy left it behind, it goes stale on its own after 90 s.

## Done when
- `https://www.<domain>` (or your status hostname) shows the status page to anyone.
- v0.6, only if you ship a website in `site/www/`: `https://www.<domain>/` shows it, `/status/` the status page, `/status.json`
  and `/health` still answer. Same route, same port — nothing to change in Cloudflare. Cloudflare caches `.js`, `.css`,
  fonts, images and zips at its edge by default (for as long as the server's `Cache-Control` says, up to a day): after
  uploading a changed site, **Caching → Configuration → Purge Everything** (or rename changed files).
  v0.7: turn **off** Scrape Shield → **Email Address Obfuscation**, **Rocket Loader** and **Web Analytics (automatic setup)**
  for your zone — they inject scripts into your pages (your site's policy then shows Content-Security-Policy errors) and
  rewrite e-mail addresses in page text. Do not widen the policy to allow them.
- `https://agent.<domain>` (or your `BK_AGENT_HOST`) asks for the Cloudflare login, then (first time) needs the link from `/bk-login`.
- From a private window with no login: neither agent.<domain> nor agent.<domain>/bk-login ever shows dsh or a link.
- `https://agent.<domain>/bk-approve` shows your approvals after the Cloudflare login, and 403 for anyone not in `BK_FOUNDER_EMAILS`.
