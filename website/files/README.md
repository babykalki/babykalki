# BabyKalki — files v1.3 (22 Nov 2026)

You describe it. Claude Code builds and deploys it. Your citizens run it.
Guide (start here): the BabyKalki page you downloaded this zip from. This folder holds every file the guide uses.

**Status — be clear about what was tested:** the Library, backups/restore (with a local folder standing in for
Cloudflare R2 and a dead endpoint for "unreachable"), the diary, the secret filter, the supervisor (with stand-ins for
dsh and cloudflared, two real Linux users), the static server and the status page are covered by the automated tests
in `tests/`. On 19 Nov 2026 an automated **dry run** followed the guide on Nimbuz with a real Z.ai key, a test domain
on Cloudflare and a MinIO bucket standing in for R2. PASSED: deploy from the zip, six citizens thinking on GLM-5.3
with their Library tools and role refusals, backup → restart → restore, the boot lease, a wrong backup key refusing to
start, a named tunnel, Access in front plus dsh's own login, the public status page, both off-switches. It found the
problems fixed in v0.4 (see the guide's change log). **v0.5 adds the Telegram community desk (`bk_telegram.py`):
unit-tested (fake Telegram API, fake LLM, real Library and supervisor) and running live in the BabyKalki group
(t.me/babykalki) since 20 Nov 2026, its full checklist still to verify — plus the
Librarian round, founder-only approvals (`/bk-approve`), citizen presets and telemetry off (below); tested with stand-ins,
the presets and the round also against a real dsh 0.2.2-rc.3 with a stand-in model; v0.5 was built on Nimbuz (staging + a
live instance, 19–20 Nov). **v0.6 adds your own public website (`site/www/`, below) — built on Nimbuz on 20 Nov 2026; it serves the guide.** PASSED live by the founder (19 Nov 2026): the
browser login via `/bk-login` and the naming ceremony; the Warden has a schedule tool in the web session. The dsh login cookie surviving a restart: checked locally on dsh
0.2.2-rc.3 (v0.7), live to verify. NOT yet tested: a first scheduled delivery, real Cloudflare R2, a local Docker run (L2),
the Warden's chat bridge, GitHub and the other L4 connectors.

**Two paths (v1.3, 22 Nov 2026).** These files are for **Path A — Build it yourself with Claude Code**: Claude Code on
your laptop checks this zip and deploys it to a Nimbuz application, with your Cloudflare domain, tunnel and Access, and
off-site backups to R2. **Path B — One-click on Nimbuz** needs no download: Nimbuz's catalogue has a BabyKalki tool
(Tools → New Tool → Babykalki; one form: Z.ai key, founder email, founder username + password, size), no domain, no
Cloudflare, no zip. It ran this kit (v1.1 on 22 Nov) behind a founder password, on a persistent volume; snapshots stay on
that SAME volume (not off-site) and there is no status page yet. Tested end to end on 22 Nov 2026 — see the guide's
sections "Choose your path" and "Path B — One-click on Nimbuz". The files in this zip are unchanged since v1.1 apart from
version numbers.

**What is enforced and what is advisory (v0.5):**
- **Commits — ENFORCED.** Found live on 19 Nov 2026: in v0.4 any dsh session could call the Librarian's connector and
  commit. In v0.5 the Librarian's full Library key is not in the web dsh at all: commits happen only in the **Librarian
  round**, a separate headless dsh run as its own Linux user (`bklib`) every 10 minutes (`BK_LIBRARIAN_EVERY_MIN`; skipped
  without a model call when nothing is pending) or at once when the Warden asks. In the web UI the Librarian can recall
  and propose. The status page shows "Librarian round: last result / at".
- **Approvals — ENFORCED (with user separation on).** Citizens can only `request_approval` (the exact text + SHA-256).
  You decide on `https://<agent host>/bk-approve` (Cloudflare Access + `BK_FOUNDER_EMAILS`); the page records the decision
  through the Library's admin port, which no citizen can reach. Approvals made before v0.5 load as "legacy".
- **Which citizen is which — ADVISORY.** Pick a citizen from the dsh web UI's preset menu (`BK_CITIZEN_PRESETS=1`, six
  presets named from the self cards, each with ONLY its own Library connector — checked offline with dsh 0.2.2-rc.3 from
  npm; the menu itself still to be seen on Nimbuz). That is a convenience: the five citizen tokens share one dsh process,
  so a session can still reach another citizen's token. The community desk does not depend on this (own process, own token).

## Check the download first
The files sit at the TOP of the zip (no folder around them — Nimbuz needs the Dockerfile there), so unzip into a new,
empty folder:
```
shasum -a 256 babykalki-files-v1.3.zip      # macOS  (Linux: sha256sum) — must equal the number on the guide page
mkdir babykalki && unzip babykalki-files-v1.3.zip -d babykalki && cd babykalki
sha256sum -c SHA256SUMS                     # macOS: shasum -a 256 -c SHA256SUMS — every line must say OK
bash tests/run_all.sh                       # optional: needs python3, node 22+, rclone
```

## What is in here
| File | What it does |
|---|---|
| `CLAUDE.md` | standing rules for Claude Code on your laptop |
| `.env.example` | names of every setting and secret — never values |
| `Dockerfile` | the one container: dsh + Library + backups + cloudflared + status page; versions and checksums pinned |
| `bk_supervisor.py` | starts/stops everything; health page first; off-switch; two users; secret-filtered, rotated logs; restart back-off |
| `bk_backup.py` | off-site snapshots to R2: copy never sync, COMPLETE markers, verified restore, restore test, prune, boot lease (one writer) |
| `bk_static.py` | strict static server for the public page (no listings, no symlinks, no dotfiles) + (v0.6) your optional public website + one-shot login helper + (v0.5) the founder-only approvals page `/bk-approve` |
| `bk_status.py` | publishes the public status page from a fixed template (counts and states only) |
| `bk_secrets.py`, `secret-patterns.json` | the ONE secret filter used by the Library, the diary and your git pre-commit check |
| `bk_chain.py` | the hash-chain format of the diary, change log and approvals: verify, anchors, erasure tombstones |
| `library_svc.py`, `library-schema.cypher` | the Library: the only writer of the fact store, with memory tools over MCP |
| `bk_telegram.py`, `community-kb.md` | v0.5: the Telegram community desk and its public knowledge (see below) |
| `community-kb.founder.example.md` | v0.8: a template for your own group's desk knowledge (About us, Product, Pricing, Start, Rules) |
| `babykalki-diary.mjs` | dsh plugin: the automatic, hash-chained diary |
| `cordis.patch.yml` | dsh settings: privacy rows (nothing to DeepSeek), Z.ai models, Library connectors, GitHub connector (L4), diary plugin |
| `cordis.librarian.yml` | v0.5: the Librarian round's own dsh settings — the ONLY place with the Librarian's full Library key |
| `cordis.citizens.tpl.yml`, `bk_presets.py` | v0.5: the six citizen presets for the dsh web UI's preset menu (rendered at every start) |
| `AGENTS.md`, `citizens/*/AGENTS.md` | the shared rulebook and each citizen's job |
| `connections-register.yml` | starting list for the Connections Register |
| `cloudflare-setup.md` | domain, Access, tunnel routes, R2 — step by step with checks |
| `site/status-template.html` | the public status page template (v0.6: put your own website in `site/www/`, see below) |
| `tests/` | automated tests (`bash tests/run_all.sh`) |
| `LICENSE` | MIT (code, configs, prompts) · CC BY 4.0 (text, diagrams) · CC0 (data) |

## Your public website (v0.6, optional)
Your public name (e.g. `www.<BK_DOMAIN>`) can show your own website instead of only the status page — no extra server,
no extra cost, same safe static server. Put the site in **`site/www/`** next to the Dockerfile (it is copied into the image
read-only at `/opt/bk/site/www`, so no citizen can change it; a change means a new upload). If `site/www/index.html`
exists:
- `https://<public name>/` serves `site/www/` (your `404.html`, if you add one, for missing pages);
- the status page moves to **`/status/`**; `/status.json` and `/health` stay where they were (Nimbuz's health check and
  any monitor keep working). A `status/` folder inside your site is never served — that path belongs to the status page.
- No `site/www/index.html` (as shipped) = exactly the v0.5 behaviour: the status page at `/` (and also at `/status/`).
Rules, the same as for the status page: plain files only — no symlinks, no dotfiles (`.well-known/` too), no folder
listings, GET/HEAD only. Your pages get their own Content-Security-Policy: **only your own files** — scripts, styles,
fonts and images from the same site (`data:` images allowed), no inline `<script>`, no `onclick=` attributes, no fonts,
analytics or embeds from other sites, no forms that post. Put scripts in `.js` files and fonts next to the pages. Caching:
pages and small text 5 minutes, `.js`/`.css` 1 hour, everything else (fonts, images, zips) 1 day — rename a big file when
it changes (a versioned zip name), or purge Cloudflare's cache after an upload. The status page keeps its strict policy
and `no-cache`. Another folder: set `BK_SITE_DIR`. Before you upload, ask Claude Code to run `bash tests/run_all.sh`
and to open your site through `python3 bk_static.py --root <any folder> --www site/www --port 8080` in a browser: the
console must show no Content-Security-Policy errors. Rule 1 still applies: the site is yours — a citizen may draft a page,
but only you put it into `site/www/` and upload it.

## Your private dashboard (v0.7)
The dsh web UI at `https://agent.<your domain>/` (behind Cloudflare Access) with BabyKalki on top: a **BabyKalki panel**
(your six citizens with "New session with …", Approvals → `/bk-approve`, Connections, Status/Library, STOP), **one
workspace per citizen**, the **Warden as the default** in the mode menu, only GLM in the model picker, and seven slash
commands (`/brief /tasks /approve-requests /connections /remember /handoff /whoami`, from `dash/skills/`). Switched off:
"Sign in"/DeepSeek account cards, 👍/👎 + Feedback, the "Upload Session Log" toggle, "Open in VS Code/Finder", the Plugins
page, DeepSeek models, dsh's own modes. Files: `bk_dash.py` + `dash/` (written to `/run/bk/dash/` at every start,
root-owned), rows in `cordis.patch.yml` §5 and `bk_presets.py`. **Your changes go in `/data/dsh/cordis.founder.yml`**
(appended after the shipped rows, so yours win) — never in `cordis.patch.yml`, which the supervisor rewrites at every start.
Settings: `BK_DASHBOARD` (1; 0 = stock dsh look, DeepSeek parts still off), `BK_DASH_SKILLS` (1), `BK_STATUS_URL`,
`BK_GUIDE_URL`, `BK_COMMUNITY_URL`. If dsh keeps exiting right after start, the supervisor turns presets and the dashboard
off for that run (status `FALLBACK`). Checked on a real dsh 0.2.2-rc.3 locally; on a live instance: to verify.

## Deploying on Nimbuz without a git repo (what Claude Code does for you)
Size: **medium.r (1 vCPU / 4 GB)** or larger — boot peaks at ~1.1 GB and small.m is throttled even when idle.
Nimbuz can build from a zip — **the Dockerfile must be at the TOP of the zip**. The zip from the guide already is:
upload it unchanged. If you changed files, make the upload zip from INSIDE the folder:
`cd babykalki && zip -r ../babykalki-deploy.zip . -x '.venv-tests/*' '*__pycache__*' '.env'`.
If Nimbuz says **FAILED with no build logs at all, the Dockerfile is not at the zip root** (seen 19 Nov 2026).
The upload call is not in Nimbuz's public docs (its path really is spelled `artificat`),
so it may change — if it fails, use the portal's upload instead:
```
GET  https://api.nimbuz.tech/deployment/v1/artificat?fileExtension=zip&environmentId=<env>&projectId=<project>
     → data.uploadUrl, data.s3Key
PUT  <uploadUrl>   with header Content-Type: application/zip and the zip as the body
PUT  https://api.nimbuz.tech/deployment/v1/deployments/<app-id>
     {projectId, environmentId, sourceCode:{type:"file", s3FileKey:<s3Key>, vcsAutoDeploy:false, folderPath:"",
      dockerFileName:"Dockerfile"}, environment:{…}, secret:{…}}      → rebuild (~5 min) + rolling restart
```
⚠ **Nimbuz replaces the whole Secrets map, it never merges.** Every PUT that includes `secret` must include ALL of them
(ZAI_API_KEY, TUNNEL_TOKEN, both RCLONE_CONFIG_R2_* keys, …) — a missing one is deleted (adding one secret on its own
wiped the backup keys in the dry run → WAITING_FOR_BACKUP). Leave `secret` out of the PUT to keep the current ones.
A PUT without `sourceCode` is a restart only (~30 s, no rebuild).
Restart only: the same PUT with `{"action":"restart", projectId, environmentId}`.
Pause / resume: the same PUT with `{"action":"pause"}` or `{"action":"resume"}` (only pause | resume | restart exist).
Pause writes a final snapshot first. **After uploading new code to a PAUSED app, send `resume`** — the build succeeds but the app stays at 0 copies until you do.
A few seconds with no status page during a restart or resume is normal.
The `status` field in Nimbuz's API is
not reliable (it can say STARTING for ever) — watch the logs (20–50 s behind) and your status page instead.
A restart runs the old and the new copy side by side for ~20 s: the new one shows **WAITING_FOR_LEASE** until the old
one has written its final snapshot, then restores exactly that snapshot. Nimbuz's API returns your Secrets in plain
text, so your **Nimbuz login is the master key** — 2-factor on, never give it to a citizen.

## Telegram community desk (v0.5, optional)
A bot for your PUBLIC Telegram group: it welcomes new members, answers questions from the public guide only
(`community-kb.md` + your own `community-kb.founder.md`), removes spam from new members, mutes repeat offenders, and
passes what it can't answer — and every `/report` — to your admin chat and to the Steward as a Library task.
**Status: unit-tested (tests/test_telegram.py), and running live in the BabyKalki group (t.me/babykalki) since 20 Nov 2026; on your group, do the five live checks in the guide's L6.** It is NOT the Warden's private
chat with you — that bridge is still not in the files. It runs as its own Linux user (`bkcomm`) with only its own
secrets; it has no tools, no shell and no access to your citizens, their keys or your Library's facts (exception, only
if you opt in for a prototype: `BK_COMMUNITY_USE_CODING_PLAN=1` hands it `ZAI_API_KEY` — see step 5).

1. **Create the bot.** In Telegram, open **@BotFather** → `/newbot` → a name and a username ending in `bot`. Copy the
   token into Nimbuz **Secrets** as `BK_TELEGRAM_BOT_TOKEN` (never into a chat, a file or git).
2. **Let it see group messages:** @BotFather → `/setprivacy` → your bot → **Disable**. (With privacy on, a bot only sees
   commands and replies, so it can't moderate.) Optional: `/setjoingroups` → Disable after you've added it, so strangers
   can't add your bot to their groups and spend your LLM budget; and set `BK_TG_GROUP_IDS`.
3. **Add it to your group as an admin** with **Delete messages** and **Ban users** (restrict) — nothing else. Without
   these rights it still answers, and says once in the admin chat that it can't remove spam.
4. **An admin chat:** make a small private group with your moderators and add the bot. Get the ids: add the bot, send
   any message, and open `https://api.telegram.org/bot<TOKEN>/getUpdates` in your own browser — `chat.id` (a negative
   number for groups) and `from.id` (your user id). Do this before the desk is running (it consumes the updates), or
   ask @userinfobot for your user id. Set `BK_TG_ADMIN_CHAT_ID`, `BK_TG_ADMIN_IDS` (comma-separated user ids of the
   people allowed to /mute /unmute /ban /pause /resume /stats) and `BK_TG_GROUP_IDS` (your public group).
   **Anonymous admins:** if you post as the group ("Remain anonymous" in your admin rights), Telegram hides your user id;
   the desk treats a message sent AS the group as an admin (`BK_TG_TRUST_ANON_ADMINS=1`, default). **Topics:** in a
   group with Topics the desk answers inside the topic the question came from; welcomes go to General.
   Your admin chat can simply be your own chat with the bot (its id = your user id) — press **Start** on the bot first,
   otherwise Telegram does not let it write to you.
5. **Answers (optional):** without a model key the desk replies with the best guide section and its text (retrieval-only).
   **With a model (v1.1 "Desk v2")** every message addressed to the desk — a mention, a reply to it, a DM, or the same
   member's next message within `BK_TG_FOLLOWUP_SECONDS` (180) of its answer — goes to the model, with the ~5 best guide
   sections, the six citizens and the overview as CONTEXT (never a gate), the recent conversation, the asker's notes and
   the admins' taught answers. It answers in plain words (technical when asked), in the member's language (Hinglish
   too), Telegram-sized; general startup tips are marked as general. For a BabyKalki fact it doesn't have, the model
   adds `[[ESCALATE: …]]` (the desk strips it, says "I've asked a human" and escalates). If the model fails or answers
   empty, the desk sends the best section WITH its text, never a bare link. For written answers, **recommended:** set `BK_COMMUNITY_LLM_KEY` to a **separate pay-per-use key with a spend cap**
   (a public bot serves other people). Default: Z.ai's pay-per-use API with `glm-5.3-flash` ($0.15 / $0.50 per million
   tokens in/out on 19 Nov 2026); any OpenAI-compatible (`…/chat/completions`) or Anthropic-compatible (`…/v1/messages`)
   endpoint works (`BK_COMMUNITY_LLM_URL`, `BK_COMMUNITY_LLM_MODEL`, `BK_COMMUNITY_LLM_API=auto|openai|anthropic`).
   **Prototype only — your call:** `BK_COMMUNITY_USE_CODING_PLAN=1` (and no `BK_COMMUNITY_LLM_KEY`) reuses your
   `ZAI_API_KEY` on the Coding Plan's Anthropic endpoint (`https://api.z.ai/api/anthropic/v1/messages`). The GLM Coding
   Plan is a personal-use subscription, and the bot then spends the same 5-hour/weekly quota as your citizens — so it
   is off by default. Caps: `BK_COMMUNITY_DAILY_CALLS` (v1.1 default 1000 per UTC day, then a kind "resting till
   tomorrow — see /faq"), `BK_COMMUNITY_LLM_PER_MIN` (12), `BK_TG_USER_ANSWERS_PER_HOUR` (20) and
   `BK_COMMUNITY_MAX_TOKENS` (700; thinking disabled; model `glm-5.3` on the Coding Plan). Measured live on 20 Nov 2026:
   ≈ 3,500 tokens and 2–9 s per answer. Move to a separate key before you grow.
   **Memory (v1.1, `/data/community/memory.json`, 0600, backed up):** the last 30 messages / 48 h it could see per
   chat and topic (so follow-ups work; emails and phone numbers removed, secrets filtered); up to 5 short notes per
   member that they shared about themselves (the model proposes `[[REMEMBER: …]]`; the desk refuses phones, emails,
   links, long numbers, keys, money/health words); and answers the admins taught it — `/teach question | answer`, or an
   admin replying to an escalation (to the desk's "I've asked a human" in the group, or to its note in the admin chat:
   then the answer is posted back to the member). Each taught answer also becomes a Steward task to review as a Library
   fact. Members: `/memory` shows what it keeps about you, `/forget` erases your notes and messages.
   `BK_COMMUNITY_MEMORY=0` turns memory off.
6. Set `BK_COMMUNITY_GUIDE_URL` (the page members should read) and restart. The status page shows **Community desk: ON**.
   ⚠ Adding secrets on Nimbuz **replaces the whole Secrets map** — send ALL of them (ZAI_API_KEY, TUNNEL_TOKEN, both
   RCLONE_CONFIG_R2_* keys, BK_TELEGRAM_BOT_TOKEN, BK_COMMUNITY_LLM_KEY if you use one …) in the same update.

Off: remove `BK_TELEGRAM_BOT_TOKEN` (status OFF), or the usual off-switch (`BABYKALKI_STOP=1`, the Steward's STOP) stops
it with the citizens. In the group, an admin can `/pause` answering (moderation stays on). Revoke the token in
@BotFather (`/revoke`) if it ever leaks. What it keeps: the Telegram offset, member ids with join times and strike
counts (pruned after a day or two), and (v1.1) its memory — see step 5 — in `/data/community/` (backed up with everything else); daily COUNTS go into the
diary (`/data/diary/community/`). It never logs members' messages — except the text of an escalation, which goes to
your admin chat and the Steward's task. Your own FAQ: start from `community-kb.founder.example.md` and ask the Steward to edit
`/data/citizens/steward/work/community-kb.founder.md` (or ship it as `site/community-kb.founder.md` with your website; v0.8) (`## Title` sections; the same title replaces the shipped one,
e.g. `## Community rules`). The bot treats every member message as hostile: member text, the conversation and member
notes reach the model wrapped as DATA; links outside `BK_TG_ALLOWED_LINK_DOMAINS` (default: the guide's domain) are cut
from answers; every message passes the secret filter; and an answer that holds the prompt's canary, a key/token, or the
prompt's RULES verbatim is blocked (quoting the guide is fine) — tested with deliberately obedient fake models.

## Community — ask, share, contribute (v0.7)
Questions about BabyKalki: the Telegram group **https://t.me/babykalki** (QR code on the guide page and at `/community/`).
Its desk bot, @babykalki_bot, answers in plain words from the guide (general tips marked as such); humans answer the rest. There is no public code repository yet:
send fixes to an admin in the group as a zip of the changed files plus a note (what, why, how you tested it —
`tests/run_all.sh`); accepted fixes are credited in the guide's change log. Licence: code MIT, guide text CC BY 4.0, data CC0 —
please keep "Based on BabyKalki by Robin Dey — https://bk.openkalki.org/" in anything you publish from it.

## Safety in one paragraph
dsh listens on 127.0.0.1 only and is reached through a Cloudflare Tunnel behind Cloudflare Access plus dsh's own login,
at `agent.<BK_DOMAIN>` — or any name you set in `BK_AGENT_HOST` (the status page / your website can be any hostname too).
Citizens run as a different Linux user from the infrastructure, so they cannot read the tunnel or backup secrets or
write the Library, the public page or these files. The off-switch is deterministic: `BABYKALKI_STOP=1` (or the file
`/data/STOP`) stops dsh within 5 seconds; revoking your Z.ai key is the hard stop. Nimbuz gives you no shell, so there:
set `BABYKALKI_STOP=1` and restart, or ask the Steward to stop ("STOP ALL" → it files STOP-REQUEST; the stop is latched).
To undo a latched stop: `BK_CLEAR_STOP=1` + restart, then set `BK_CLEAR_STOP` back to 0. See the guide's
"Enforced vs advisory" table for exactly which promises are mechanisms and which are only rules.

**Telemetry OFF (v0.5) — nothing goes back to DeepSeek.** Verified on dsh 0.2.2-rc.3 (19 Nov 2026): with v0.4's
settings, 👍/👎 or More → Feedback → Submit sent the conversation log to DeepSeek's collector, even with GLM. v0.5: the image
sets `DSH_TELEMETRY_MODE=DISABLED` and `DSH_TELEMETRY_OTLP_URL=http://127.0.0.1:9/`, the supervisor forces them again in
dsh's environment whatever your Nimbuz settings say (only `BK_ALLOW_TELEMETRY=1` turns that off), and `cordis.patch.yml`
section 0 switches off eight dsh rows (session telemetry, the "Upload Session Log" setting, plugin inventory, DeepSeek
account and web search, product analytics). 👍/👎 then stay in your own session log. "Sign in" still shows in dsh's More
menu but does nothing — never sign in with a DeepSeek account. Check once at L2: **Settings → "Upload Session Log when
using the official model API" shows OFF**, and the status page says "Telemetry to DeepSeek (dsh): OFF".

Licence: see `LICENSE`. © 2026 Robin Dey.
