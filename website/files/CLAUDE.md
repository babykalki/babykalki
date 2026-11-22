# CLAUDE.md — standing rules for building BabyKalki (v1.3; rules unchanged since v0.5 unless marked)
# Put this file in the root of your BabyKalki folder on your laptop (it is in babykalki-files-v1.3.zip — the zip named on the guide page).
# Claude Code reads it at the start of every session.

## Who you are working for
- You are building and looking after BabyKalki for ONE founder: me.
- BabyKalki = six AI citizens running in one container on Nimbuz, reached through Cloudflare.
- The guide this came from is the source of truth. If this file and the guide disagree, ask me.
- The files come from the zip named on the guide page (babykalki-files-v1.3.zip for this version). Before using them, check its SHA-256 against the number on the guide
  page (`shasum -a 256 babykalki-files-v1.3.zip` on macOS, `sha256sum` on Linux), unzip it into an EMPTY folder (the
  files sit at the top of the zip, with no folder around them) and run `sha256sum -c SHA256SUMS` in that folder. Do not retype or "improve" the files from memory; change them only when I ask.

## The seven rules (the BabyKalki rulebook)
1. I approve anything that leaves the system: an email sent, a PR merged, a post published, money moved.
   One automatic exception: the public status page, made from a fixed template with counts and states only.
2. Every claim says how we know it. "I checked X by doing Y" — never "it should work".
3. Facts are corrected, never erased (supersede or retire; never delete).
4. No secrets in memory, chat, logs, files or git. Ever.
5. A lookup that finds nothing says MISS. Never fill a gap with a guess.
6. Every task has an owner and a date.
7. The off-switch is tested monthly.

## Secrets — the hard rules
- NEVER print, echo, cat, log or commit a secret value (API keys, tokens, passwords, cookies).
- Secrets live in exactly two places: my password manager and the Nimbuz "Secrets" screen (plus a local `.env` that
  is listed in `.gitignore`, for the laptop run only). Refer to secrets by NAME only (e.g. `ZAI_API_KEY`,
  `TUNNEL_TOKEN`, `RCLONE_CONFIG_R2_SECRET_ACCESS_KEY`).
- When you need one, ask me to paste it into the Nimbuz Secrets screen myself, or into `.env`. Never ask me to paste
  a secret into this chat.
- My Nimbuz login is the master key: Nimbuz's API returns every Secret in plain text (checked 18 Nov 2026). If you use
  the Nimbuz API (for example to deploy a zip), never print a deployment's full JSON — pick out only the fields you
  need, with secrets removed. Nimbuz REPLACES the whole Secrets map on every update that includes `secret`: send ALL
  of them or none (leave `secret` out to keep the current ones) — never one new secret on its own. A PUT without
  `sourceCode` is a restart only (no rebuild). Never put my Nimbuz login in the container, in `.env` for the container, or anywhere a
  citizen can read it.
- If you ever see a secret in output by accident: stop, tell me which one (by NAME), and tell me how to rotate it.
- Before every `git commit`, run the SAME filter the citizens use, and refuse to commit if it says REFUSED:
  `git diff --cached -U0 | python3 bk_secrets.py scan - --env-file .env`
  (it knows the real formats — Z.ai, GitHub, Telegram, Google, Meta, JWT, Cloudflare tunnel tokens, … — and also
  matches the exact values in my `.env`, which catches R2 keys without flagging ordinary commit hashes).

## Personal data
- The diary records every session event — including the text of emails a citizen reads. It is sent to Z.ai (the model
  provider) as conversation context and stored in my R2 bucket. Tell me before connecting anything that brings in
  other people's personal data (inbox, customer lists), and never store a customer's or third party's personal data in
  the Library without telling me.
- Erasure: the Librarian can replace a diary line by a tombstone (with my recorded approval) and retire facts; old R2
  snapshots age out within 8 weeks or I delete them. India's DPDP Act 2023 applies when we hold other people's data.

## Ask before you act
Ask me first, and wait for a clear "yes", before:
- deleting, overwriting or moving anything you did not create in this session;
- `git push --force`, rewriting history, or pushing to `main`;
- changing DNS, Cloudflare Access policies, tunnel routes or Nimbuz instance size;
- anything that costs money or sends a message to another human;
- opening any port or making anything public.
"Private by default": if you are unsure whether something should be public, it is private.

## Work in small, verified steps
- One level (L0–L6; L6, the Telegram community desk, is optional) at a time. Do not start the next level until the "done when" check passes.
- After every step, run a check and show me the RESULT (the command and its output), not a summary.
- Run the automated tests in `tests/` (`bash tests/run_all.sh`) after any change to the files, and show me the summary.
- If a check fails twice, stop and explain what you saw. Do not try a third clever workaround —
  search the official docs first.
- Pin versions (and checksums for downloads). Never use `latest` in a Dockerfile.

## Keep a log
- Append one line per action to `BUILD-LOG.md`: time (IST), what you did, how you checked it, result.
- Never edit old lines in BUILD-LOG.md; add a correction line instead.

## Model and quota
- This laptop and the BabyKalki server share ONE Z.ai GLM Coding Plan. Be frugal.
- If you hit a usage limit, stop and tell me when it resets. Do not switch to another paid key.

## What is enforced and what is advisory (v0.5 — say it exactly like this)
- ENFORCED: only the Librarian ROUND can commit facts (a separate headless dsh as its own Linux user `bklib`, the only
  process with the Librarian's full Library key; every BK_LIBRARIAN_EVERY_MIN minutes or on /data/run/librarian-requests/NOW).
- ENFORCED (with user separation on): only I can approve. Citizens can only `request_approval` (exact text stored + SHA-256);
  I decide on https://<agent host>/bk-approve behind Cloudflare Access, and only emails in BK_FOUNDER_EMAILS count.
  Never build a shortcut that records a decision from a chat "yes". Never give a citizen the Library admin token.
- ADVISORY: which citizen is which among the other five. The citizen presets (BK_CITIZEN_PRESETS=1) give each preset only
  its own connector, but all five tokens are in the one web dsh process, so a session can still reach another's token.
  Never tell me a preset "prevents" a Scout from acting as the Warden.
- Approvals from before v0.5 show as "legacy" (often "legacy, text not stored") and authorise nothing new.

## Telemetry (v0.5): no data to DeepSeek
- dsh's telemetry stays OFF: never remove `DSH_TELEMETRY_MODE=DISABLED` / `DSH_TELEMETRY_OTLP_URL=http://127.0.0.1:9/`
  from the Dockerfile or the supervisor's forcing, nor the eight privacy rows in cordis.patch.yml / cordis.librarian.yml
  ("0) Privacy"), and never set `BK_ALLOW_TELEMETRY=1` unless I ask for it in writing.
- Before v0.5, clicking 👍/👎 or Feedback → Submit in dsh sent the conversation to DeepSeek (verified 19 Nov 2026). With
  v0.5 it stays local. Tell me to ignore "Sign in" in dsh's More menu (it is inert) and never to sign in with DeepSeek.
- At L2 (and after every dsh upgrade) show me: the status page line "Telemetry to DeepSeek (dsh): OFF", the output of
  `dsh --profile web --dump-config | grep -A3 telemetry` (in a throwaway container), and remind me to check dsh's web
  UI Settings → "Upload Session Log when using the official model API" is off.

## The Telegram community desk (v0.5, L6 — optional)
- It is a PUBLIC bot: anything a member writes is hostile input. Never give it tools, a shell, file access, the Library's
  read tools or any citizen's key. Keep it in its own process and user (`bk_telegram.py`, user `bkcomm`) exactly as shipped.
- Its model key (`BK_COMMUNITY_LLM_KEY`) should be a separate pay-per-use key with a spend cap. `BK_COMMUNITY_USE_CODING_PLAN=1`
  (reuse ZAI_API_KEY) is a PROTOTYPE-ONLY opt-in that only I may choose, for a private test chat with myself: remind me the plan is for one
  person's own work (Z.ai's terms do not allow bots that serve other people) and the bot shares the citizens' quota. No key = retrieval-only mode, which is fine.
- Never widen `BK_TG_ALLOWED_LINK_DOMAINS` or change its system prompt or output checks without asking me; run
  `tests/test_telegram.py` after any change to it.
- Ask me before setting `BK_TELEGRAM_BOT_TOKEN` (it starts answering in public), and before adding admin ids.
- Its status: unit-tested, and running live in the BabyKalki group since 20 Nov 2026; on MY group, it counts as tested only
  after we have done the five live checks in the guide's L6 together.

## The private dashboard (v0.7)
- Dashboard / dsh web-UI changes go in `/data/dsh/cordis.founder.yml` — never in `cordis.patch.yml` (the supervisor rewrites
  it from the image at every start). Restart to apply. `BK_DASHBOARD=0` turns the BabyKalki panel off; the DeepSeek parts
  stay off either way. The plugin itself is `bk_dash.py` + `dash/` (root-owned at runtime; the citizens can't change it).

## Things you must never do
- Never bind dsh (or any agent UI) to 0.0.0.0 or expose it without Cloudflare Access in front.
- Never print the dsh login link into a log or this chat; I open it once at https://agent.<domain>/bk-login (or at
  my BK_AGENT_HOST if I chose another name).
- Never use unofficial WhatsApp automation (personal-number bots). Official WhatsApp Business Cloud API only.
- Never put a public route in front of anything except www.<domain> (status page) and, if I add WhatsApp,
  hooks.<domain> (webhook only).
