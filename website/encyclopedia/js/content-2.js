/* BabyKalki Encyclopedia — chapters 10–19 + map data. Source: BabyKalki guide v1.3 (22 Nov 2026). */
window.OK = window.OK || {}; OK.chapters = OK.chapters || [];

OK.chapters.push({
  id: 'dashboards', n: 10, title: 'Your dashboards: private panel, public site, off-switch', level: 'Build', mins: 9,
  breath: 'Your private dashboard — the same on both paths — is the dsh web UI with BabyKalki on top: your six citizens in a panel, one workspace each, seven slash commands, the DeepSeek parts switched off, behind two locks. The public side — your own website with a counts-only status page at /status/ — is Path A only. And the off-switch needs no AI at all (on Path B: stop the tool in Nimbuz).',
  body: `
<div class="callout"><b>Which path?</b> The private dashboard, the panel, the workspaces and the slash commands are <b>the same on both paths</b>. <b>Path A — Build it yourself with Claude Code:</b> at <code>agent.yourdomain</code>, behind Cloudflare Access + dsh's login, with an optional public website and the status page. <b>Path B — One-click on Nimbuz:</b> at your Nimbuz address, behind the founder password + dsh's login; no public website and no status page yet; the off-switch is <b>stopping the tool in Nimbuz</b>.</div>
<div class="grid3">
<div class="card"><b>🔒 Private — agent.yourdomain (Path B: your Nimbuz address)</b><p>The dsh web UI with BabyKalki on top (since v0.7): your six citizens as cards, one workspace per citizen, the Warden as the default, seven slash commands. Two locks: Cloudflare Access + dsh's own login (on Path B the first lock is the founder username and password instead). dsh listens on 127.0.0.1 only; the tunnel is the only way in (on Path B: Nimbuz's HTTPS front door, with the founder password in front of <code>/bk-login</code> and <code>/bk-approve</code>). Approvals are <i>not</i> inside dsh — they are on <code>/bk-approve</code>.</p></div>
<div class="card"><b>🌐 Public — www.yourdomain (Path A only)</b><p>Your own website if you want one (since v0.6), and the <b>status page at <code>/status/</code></b> — a fixed template with counts and states only, nothing a citizen writes. Citizens can't write to either. Served by a tiny safe server: no listing, no symlinks, no dotfiles.</p></div>
<div class="card"><b>⏻ The off-switch</b><p>On Nimbuz (no shell): set <code>BABYKALKI_STOP=1</code> and restart, or ask the Steward to "STOP ALL" (latched). On a laptop: create <code>/data/STOP</code>. The supervisor checks every 5 seconds, stops dsh, and the status page says STOPPED. <b>Path B:</b> stop the tool in Nimbuz (tested).</p></div>
</div>
<h3>Your private dashboard (since v0.7)</h3>
<p>It is the dsh (DeepSeek Harness) web UI at <code>https://agent.yourdomain/</code>, with BabyKalki's settings on top. <span class="tag live">checked locally on real dsh 0.2.2-rc.3</span> (web UI booted with the kit's own config and driven with a headless browser, 20 Nov 2026). On the founder's live instance the v0.7 start-up check confirmed the panel is on, the seven slash commands are installed, only GLM models are offered and the DeepSeek account settings are disabled; <span class="tag plan">to verify</span>: how it looks there in a browser (that needs the founder's own login). <span class="tag live">seen on Path B, 22 Nov 2026</span> in a browser: the BabyKalki panel ("Kit v1.1"), six citizens on GLM-5.3.</p>
<ul>
<li><b>BabyKalki brand</b> — the lotus and "BabyKalki" top left, in the browser tab and as the favicon, instead of DeepSeek's artwork.</li>
<li><b>The BabyKalki panel</b> (top of the left sidebar): the six citizens as cards — the name from your naming ceremony (e.g. <i>Alfred</i>), the role (<i>Warden · default</i>), one line on what they do and a <b>New session with …</b> button; a button to <b>Approvals</b> (<code>/bk-approve</code>); where the Connections Register lives; links to your status page and the guide; the slash commands; how to STOP everything.</li>
<li><b>Citizen workspaces</b> — one per citizen in the sidebar (<i>Alfred · Warden</i>, <i>Edith · Librarian</i> …, Warden on top). Every session sits under the citizen it belongs to, so you no longer get a list of look-alike sessions.</li>
<li><b>The empty home page</b> asks <b>"Who do you want to talk to?"</b> with a button per citizen, plus Approvals and Status links.</li>
<li><b>The mode menu</b> (above the message box) lists exactly your six citizens, each a <b>citizen preset</b>; the Warden is ticked by default. dsh's own Standard / PTC / Minimal / Creator modes are hidden — they have no Library access, and Creator writes dsh plugins.</li>
<li><b>The model picker</b> shows only GLM-5.3 (and GLM-5.3-Flash, listed for later). DeepSeek's models are gone.</li>
</ul>
<h3>Picking who you talk to</h3>
<ol class="steps">
<li>Panel → <b>New session with &lt;name&gt;</b>; or</li>
<li>the empty home page → the citizen's button; or</li>
<li><b>New Session</b>, then choose the citizen in the mode menu.</li>
</ol>
<p>The first two set both the workspace and the mode for you. The session header shows the citizen (for example "Edith · Librarian"); an existing session keeps its citizen. A new name from the naming ceremony appears in the panel, the menu and the workspace titles after the next restart; a workspace you renamed yourself is never renamed back.</p>
<h3>Seven slash commands</h3>
<p>Type <code>/</code> in the message box. They are dsh "skills" that <b>only you</b> can start — the citizens can't call them on their own. Each uses only that citizen's own Library connector; when a tool is not allowed for that role, the citizen says so (only the Warden, the Steward and the Librarian round add tasks; only the Steward changes a connection).</p>
<table class="tbl">
<tr><th>Type</th><th>What the citizen does</th></tr>
<tr><td><code>/brief</code></td><td>the briefing now: done, waiting for your approval, blocked or overdue, health (backups, Librarian round), next</td></tr>
<tr><td><code>/tasks</code></td><td>open Library tasks, overdue first, by owner (<code>/tasks scout</code>, <code>/tasks done</code>)</td></tr>
<tr><td><code>/approve-requests</code></td><td>what waits for your approval, with the exact text — you decide on <code>/bk-approve</code></td></tr>
<tr><td><code>/connections</code></td><td>the Connections Register: owner, scope, 🟢/🟠/🔴, spend against cap, expiry; flags red, expiring and over-cap</td></tr>
<tr><td><code>/remember &lt;text&gt;</code></td><td>proposes it as a Library fact (the Librarian round commits it within minutes)</td></tr>
<tr><td><code>/handoff &lt;citizen&gt; &lt;what&gt;</code></td><td>a Library task for another citizen, and how to open that citizen</td></tr>
<tr><td><code>/whoami</code></td><td>which citizen this session is, its connector, what it may and may not do</td></tr>
</table>
<h3>What BabyKalki switched off in stock dsh</h3>
<ul>
<li>"Sign in", DeepSeek account settings and account notice cards — you never use a DeepSeek account; Z.ai is your model provider.</li>
<li>👍/👎, the Feedback menu and <code>/feedback</code> — in v0.4 a click sent the conversation to DeepSeek; v0.5 stopped that; v0.7 removes the buttons.</li>
<li>Settings → "Upload Session Log when using the official model API" (off since v0.5, now hidden).</li>
<li>"Open in VS Code / Finder" — it opens apps on the machine dsh runs on; your server has none.</li>
<li>The Plugins page, "Create your plugin" and "Browse other plugins" — installing plugins from the browser would bypass the kit and its review.</li>
<li>DeepSeek models in the picker, and dsh's own Standard / PTC / Minimal / Creator modes.</li>
</ul>
<p>The v0.5 privacy rows stay underneath: no telemetry, no session-log upload, no plugin inventory, no DeepSeek web search.</p>
<h3>Honest limits — still stock dsh</h3>
<ul>
<li>A one-time <b>"Preview Notice"</b> from DeepSeek Harness on your first visit (press Continue; it does not come back).</li>
<li>Inside dsh every session's agent is called <b>"lead"</b> (in the Trajectory tab, for example). The citizen shows in the session header and the workspace.</li>
<li>Session titles come from your first message (one small extra Z.ai call per new session) and don't include the citizen's name.</li>
<li>Automation tasks (dsh schedules) and Settings are dsh's own pages. A first visit may briefly show "Unable to create default workspace" — harmless.</li>
<li><b>The panel is a convenience, not a lock.</b> What is <i>enforced</i> is unchanged: only the Librarian round commits; only you approve. Which of the other five citizens a session acts as stays <span class="tag plan">ADVISORY</span>.</li>
</ul>
<h3>Logging in after a restart</h3>
<p><b>Path B:</b> open <code>/bk-login</code> on your Nimbuz address — the browser asks for the founder username and password — and click the link once; in our test the 30-day cookie survived three restarts, so you need <code>/bk-login</code> again only on a new browser or device (or, if you lose it, after you stop and start the tool). <b>Path A:</b> open <code>agent.yourdomain/bk-login</code> once (behind Access): it shows your dsh login link once, then answers "gone"; the link is never written to a log. The login sets a signed cookie valid for <b>30 days</b> that <b>survives restarts</b> — its signing secret is in <code>/data/dsh/.credentials.yaml</code>, which is backed up and comes back on restore. <span class="tag live">checked locally</span> on dsh 0.2.2-rc.3; <span class="tag plan">to verify</span> live. You need <code>/bk-login</code> again only after 30 days, on another browser or device, after clearing cookies, on a new hostname, or after a fresh start without a restore. <b>Cloudflare Access</b> asks for your email code again when <i>its</i> session ends (24 h in the guide's setup) — that is the usual "log in again".</p>
<h3>Changing it: cordis.founder.yml (Path A)</h3>
<p>The supervisor rewrites <code>/data/dsh/cordis.patch.yml</code> from the image at every start; <b>your</b> changes go in <code>/data/dsh/cordis.founder.yml</code> — appended after the shipped rows, so yours win; restart to apply. For example <code>- id: preset-standard</code> / <code>disabled: false</code> brings dsh's Standard mode back, and <code>- id: agent-preset-registry</code> / <code>config: { default: bk-scout }</code> makes the Scout the default. Settings: <code>BK_DASHBOARD</code> (1; 0 = no panel, brand, buttons or workspaces — the DeepSeek parts stay off either way), <code>BK_DASH_SKILLS</code> (1; 0 = no slash commands), <code>BK_STATUS_URL</code>, <code>BK_GUIDE_URL</code>, <code>BK_COMMUNITY_URL</code> (optional), <code>BK_CITIZEN_PRESETS</code> (1). Your own slash commands: <code>SKILL.md</code> folders in <code>/data/dsh/skills/&lt;name&gt;/</code> (the seven above are rewritten at every start). If dsh keeps exiting right after start, the supervisor switches presets and the dashboard off for that run (status FALLBACK).</p>
<p class="status">In the kit: <code>cordis.patch.yml</code> §5 (the rows that switch DeepSeek parts off), <code>bk_presets.py</code> (Warden default, dsh modes hidden), <code>bk_dash.py</code> + <code>dash/bk-dashboard/</code> (the browser plugin — filled in with your citizens' names at every start and written to a root-owned folder, so the citizens cannot change what your browser runs; it only draws the UI and creates the six workspaces, and sends nothing anywhere), <code>dash/skills/</code>, <code>tests/test_dash.py</code>.</p>
<h3>Your public website (since v0.6, optional — Path A only)</h3>
<p>Path B has no public name yet, so no website.</p>
<p>The public name can show <b>your own website</b> instead of only the status page — no second server, no extra cost. Put your pages in <code>site/www/</code> next to the Dockerfile (an <code>index.html</code> at least) and upload as usual. Then <code>https://www.yourdomain/</code> is your site, the status page moves to <b><code>/status/</code></b>, and <code>/status.json</code> and <code>/health</code> stay where they were, so Nimbuz's health check and your monitors keep working. Without <code>site/www/index.html</code> nothing changes. <span class="tag live">live</span> — this encyclopedia and the guide are published exactly that way: the founder's own BabyKalki serves <code>bk.openkalki.org</code> (since 20 Nov 2026).</p>
<ul>
<li><b>Read-only:</b> the site is baked into the image (root-owned). No citizen can change it; a new version means a new upload. Rule 1 still holds — a citizen may <i>draft</i> a page, only you publish it.</li>
<li><b>Same safe server:</b> plain files only — no symlinks, no dotfiles, no folder listings, GET and HEAD only. Your own <code>404.html</code> is used for missing pages.</li>
<li><b>Own files only:</b> your pages get a <b>Content-Security-Policy</b> that allows scripts, styles, fonts and images from your own site and nothing else — no inline <code>&lt;script&gt;</code>, no <code>onclick=</code>, no fonts, analytics or embeds from other sites. The status page keeps its stricter policy.</li>
<li><b>Caching:</b> pages 5 minutes, scripts and styles 1 hour, fonts, images and zips 1 day (Cloudflare keeps those at its edge too); the status page is never cached.</li>
<li><b>Check before you upload:</b> ask Claude Code to open your site through <code>bk_static.py --www site/www</code> in a browser and show you the console — no "Content-Security-Policy" errors. Nothing changes in Cloudflare: same route, same port.</li>
</ul>
<h3>What the status page shows (Path A — Path B has none yet)</h3>
<p><code>bk_status.py</code> collects numbers and states only — system state (RUNNING, STOPPED, WAITING_FOR_LEASE …), live facts, proposals waiting, open and overdue tasks, connections and red ones, backup state, last backup, last restore test, diary files anchored off-site, <i>Telemetry to DeepSeek (dsh)</i> OFF/ALLOWED, <i>Librarian round</i>, <i>Approvals waiting for the founder</i>, <i>Who can approve</i>, <i>Citizen presets</i> and <i>Community desk (Telegram)</i> with today's counts — fills the fixed template and writes it as the infra user. A good thing to link from your pitch deck: <i>"our agents keep this page running"</i>.</p>
<h3>Four ways to stop</h3>
<ol class="steps">
<li><b>Soft stop:</b> <code>/data/STOP</code> or <code>BABYKALKI_STOP=1</code> + restart. Needs no model and no quota. The Steward's "STOP ALL" writes a stop request that <b>latches</b> — one-way: only you can restart.</li>
<li><b>Undo, the Nimbuz way:</b> set <code>BK_CLEAR_STOP=1</code> and restart — then set <code>BK_CLEAR_STOP</code> back to 0, or every later restart silently undoes a Steward stop (the supervisor logs a reminder while it is 1).</li>
<li><b>Hard stop:</b> revoke the Z.ai key — nothing can think without it.</li>
<li><b>Last resort:</b> pause the app in Nimbuz, or delete the tunnel in Cloudflare.</li>
<li><b>On Path B:</b> stop the tool in Nimbuz (⋮ → Stop) — tested on 22 Nov 2026; start it again later and the data is still there. <code>BABYKALKI_STOP</code> and the Steward's "STOP ALL" were not tested on Path B, and there is no status page to show STOPPED. The hard stop — revoking the Z.ai key — works the same.</li>
<li><b>Drill:</b> the off-switch is tested on the 1st of every month (rule 7). Both stops passed in the 19 Nov dry run.</li>
</ol>`,
  analogy: 'A shop with a window that shows your own posters and the opening-hours board (the public site and status page), a locked back office with a name card on every desk and a "who do you want to talk to?" sign at the door (the private dashboard), and a big red mains switch that works even in a power cut.',
  mistakes: ['Clicking "Status" in the panel on Path B and thinking BabyKalki is down. That link is broken on Path B (certificate error); ask the Steward with /brief.', 'Looking for the Approve button inside dsh. Approvals are on /bk-approve, linked from the panel and the home page.', 'Reading the panel or the mode menu as a security wall. It is a convenience; what is enforced is unchanged.', 'Thinking you must use /bk-login after every restart. The dsh cookie lasts 30 days and survives restarts; the usual re-login is Cloudflare Access after 24 h.', 'Editing cordis.patch.yml on the server. It is rewritten at every start — your changes go in cordis.founder.yml.', 'Putting an inline <script> or onclick= in your website. The site\'s Content-Security-Policy blocks it; use .js files.', 'Putting free text on the status page. It is template-only; anything else public needs your approval.', 'Thinking the off-switch needs the AI. The supervisor checks a file — no model involved.', 'Leaving BK_CLEAR_STOP=1 after an undo — every later restart then silently undoes a Steward stop.'],
  teach: ['Show the panel screenshot and ask: "Which three ways start a session with the Scout?"', 'Have learners match each slash command to a question a founder asks at 9 a.m. ("what is waiting for me?" → /approve-requests).', 'Demo: touch /data/STOP and watch the status page flip to STOPPED.', 'Ask: "Why must the off-switch work with zero quota?" (Because quota running out is a common emergency.)'],
  terms: ['Path B', 'Private dashboard', 'BabyKalki panel', 'Citizen workspace', 'Mode menu', 'Slash command', 'cordis.founder.yml', 'BK_DASHBOARD', 'Public website', 'Content-Security-Policy', 'Status page', 'Off-switch', 'STOP file', 'bk_static', 'BK_CLEAR_STOP'],
  quiz: [
    { q: 'How can you start a session with the Scout?', o: ['Only by typing "be the Scout"', 'Panel → New session with <name>, the Scout\'s button on the home page, or New Session + the Scout in the mode menu', 'Only from Telegram', 'You can\'t; only the Warden talks'], a: 1, why: 'The first two set the citizen\'s workspace and mode for you; the session header then shows the citizen.' },
    { q: 'Where do you approve a request?', o: ['With 👍 in dsh', 'On /bk-approve, the founder-only page linked from the panel', 'In the Telegram group', 'By asking the Steward'], a: 1, why: 'Approvals are not inside dsh; /approve-requests only lists what is waiting.' },
    { q: 'What does /remember <text> do?', o: ['Commits a fact at once', 'Proposes a Library fact; the Librarian round commits it within minutes', 'Writes to the public page', 'Emails you'], a: 1, why: 'Only the Librarian round commits — the slash command doesn\'t change that.' },
    { q: 'Which models does the model picker show?', o: ['DeepSeek and GLM', 'Only GLM-5.3 (and GLM-5.3-Flash, for later)', 'Every model on OpenRouter', 'None'], a: 1, why: 'Only your GLM Coding Plan models are configured; DeepSeek\'s models are hidden.' },
    { q: 'Your Nimbuz app restarted. Do you need /bk-login again?', o: ['Yes, after every restart', 'Usually not — the dsh cookie lasts 30 days and survives restarts; Cloudflare Access may ask for your email code again', 'Only on Mondays', 'You must reinstall'], a: 1, why: 'The cookie\'s signing secret is backed up with /data/dsh. Checked locally; live to verify.' },
    { q: 'Where do your own dashboard changes go?', o: ['cordis.patch.yml', '/data/dsh/cordis.founder.yml', 'AGENTS.md', 'The Library'], a: 1, why: 'cordis.patch.yml is rewritten at every start; cordis.founder.yml is appended after it, so yours win.' },
    { q: 'You add your own website in site/www/. Where is the status page now?', o: ['Gone', 'At /status/ — /status.json and /health stay where they were', 'On agent.yourdomain', 'On Telegram'], a: 1, why: 'Without site/www/index.html nothing changes; with it, your site is at / and the status page at /status/.' },
    { q: 'What may appear on the public status page?', o: ['Blog posts by the Builder', 'Counts and states from a fixed template', 'Your inbox summary', 'Anything the Warden approves'], a: 1, why: 'Counts and states only; no text a citizen wrote can reach it.' },
    { q: 'On Path A there is no shell into the Nimbuz app. How do you switch BabyKalki off?', o: ['You can\'t', 'Set BABYKALKI_STOP=1 and restart, or ask the Steward to "STOP ALL"', 'Delete /data by hand', 'Email Nimbuz'], a: 1, why: 'Both stops passed in the dry run; the Steward\'s stop latches.' },
    { q: 'On Path B, how do you switch BabyKalki off?', o: ['Delete the tool', 'Stop the tool in Nimbuz', 'Close the browser tab', 'Change the password'], a: 1, why: 'Tested on 22 Nov 2026: the data stays on the volume. Deleting the tool would delete the data too.' },
    { q: 'Does Path B have a public status page or website?', o: ['Yes, at /status/', 'Not yet — the panel\'s Status link is broken; ask the Steward with /brief', 'Only on weekends', 'Yes, on www.'], a: 1, why: 'The website and the status page are Path A only for now.' },
    { q: 'You undid a stop with BK_CLEAR_STOP=1. What must you do next?', o: ['Nothing', 'Set BK_CLEAR_STOP back to 0', 'Delete the Steward', 'Rotate the Z.ai key'], a: 1, why: 'Otherwise every later restart silently undoes a Steward stop.' }
  ]
});

OK.chapters.push({
  id: 'connections', n: 11, title: 'The Connections Register', level: 'Use', mins: 5,
  breath: 'Every API key is a door, so the Steward keeps a register of every door — what it may do, who uses it, where the secret lives (name only), what it costs, when it expires and how to kill it.',
  body: `
<p>The Steward records each connection in the Library with <code>register_connection</code> — never the secret itself — mirrored as a readable <code>connections-register.yml</code>.</p>
<div class="callout"><b>Path B — One-click on Nimbuz:</b> the Steward keeps the same Register, but Nimbuz's form has no fields for more keys yet, so you can't add connector keys there (not tested) — new connections (L4) are a Path A step for now. The Telegram community desk is not offered on Path B either. Your Z.ai key and founder password live in the tool's settings in Nimbuz.</div>
<table class="tbl">
<tr><th>Field</th><th>Example</th></tr>
<tr><td>Service</td><td>GitHub (one repo)</td></tr>
<tr><td>May do (scope)</td><td>Contents, pull requests, issues — read and write, on one repo only. No admin.</td></tr>
<tr><td>Used by</td><td>Builder, Reviewer, Librarian</td></tr>
<tr><td>Secret lives in</td><td>Nimbuz Secret <code>BK_GITHUB_TOKEN</code> — the name only</td></tr>
<tr><td>Cost &amp; monthly cap</td><td>Free · —</td></tr>
<tr><td>Expires / rotate</td><td>90 days</td></tr>
<tr><td>Kill switch</td><td>GitHub → Settings → Developer settings → Fine-grained tokens → Revoke</td></tr>
<tr><td>Last used</td><td>filled in by the Steward</td></tr>
</table>
<h3>The habits</h3>
<ul>
<li>Secrets live only in your <b>password manager</b> and <b>Nimbuz Secrets</b> (on Path B: the tool's settings in Nimbuz) — never in chat, memory, prompts, files or the dashboard.</li>
<li>On the 1st of each month: unused for 30 days → the Steward proposes revoking it; expiring within 14 days → you get a reminder.</li>
<li>Every connection starts with the <b>narrowest scope that works</b>. Widening a scope is an approval like any other: requested with <code>request_approval</code>, decided by you on <code>/bk-approve</code>.</li>
<li>dsh strips every environment variable whose name contains KEY, TOKEN, SECRET or PASSWORD from child processes; a connector gets its key through its own <code>env:</code> block — so each tool sees only its own key.</li>
</ul>
<h3>Scopes that matter</h3>
<ul>
<li><b>Gmail:</b> read + drafts only, never the full-mail scope. You press Send.</li>
<li><b>Calendar:</b> read-only. <b>Drive:</b> one folder.</li>
<li><b>GitHub:</b> a fine-grained token on ONE repo. On GitHub Free, private repos can't enforce branch protection — so either use a public repo with protected main, GitHub Pro, or a separate private <code>[repo]-agents</code> repo that you pull from yourself. Wherever main is protected, tick "Do not allow bypassing" — the token acts as you.</li>
<li><b>Payments:</b> Razorpay or Stripe read-only. Agents never move money.</li>
<li><b>WhatsApp:</b> only the official Business Platform (Cloud API). Unofficial automation of a personal number gets numbers banned.</li>
</ul>
<div class="callout"><b>The one-line rule:</b> if you can't say what a key may do, who uses it and how to kill it — don't connect it.</div>
<h3>The Telegram Community Desk (optional, L6 — since v0.5; Path A only)</h3>
<p>A bot for your <b>public</b> Telegram group, as your community grows. It is <b>not a citizen</b> and not the Warden's private chat with you (that bridge is not in the files). <span class="tag live">live in t.me/babykalki since 20 Nov 2026</span> as <b>@babykalki_bot</b>, on the founder's own BabyKalki; the full five-step checklist is <span class="tag plan">to verify</span> (see <a href="#/c/status">chapter 18</a>).</p>
<h4>What it does</h4>
<ul>
<li><b>Welcomes</b> each new member with one short message (guide link, <code>/rules</code>, how to ask) and deletes its previous welcome; commands <code>/start /help /rules /guide /faq /report</code>. A plain "hi", introduction or "thanks" gets a friendly reply, not an escalation.</li>
<li><b>Answers</b> in DMs and when @mentioned — only from the public guide (<code>community-kb.md</code>, generated from the guide page, plus your own <code>community-kb.founder.md</code>). If the best section covers too little of the question it escalates instead of guessing.</li>
<li><b>Removes spam:</b> links, forwards and media from members in their first 24 hours are deleted with one warning; more than 6 messages in 15 s is a flood; three strikes in a day = muted for 24 h and your moderators are told.</li>
<li><b>Hands over to a human:</b> what it can't answer, and every <code>/report</code>, goes to your moderators' chat and becomes a Steward task in the Library (member text quoted as untrusted). Nothing goes back to the group without your approval.</li>
<li>Admins get <code>/mute /unmute /ban /pause /resume /stats</code>. <b>Anonymous admins:</b> if you post as the group ("Remain anonymous"), Telegram hides your user id, so the desk treats a message sent <i>as the group</i> as an admin (<code>BK_TG_TRUST_ANON_ADMINS=1</code>, the default).</li>
<li><b>Topics:</b> in a group with Topics the desk answers inside the topic the question came from; welcomes go to General.</li>
</ul>
<h4>How it stays safe</h4>
<ul>
<li><b>Its own Linux user</b> (<code>bkcomm</code>) and only its own secrets: <code>BK_TELEGRAM_BOT_TOKEN</code>, <code>BK_COMMUNITY_LLM_KEY</code> and its own Library token. The citizens never get them (in v0.4 they did receive the bot token).</li>
<li><b>No tools, no shell, no private facts:</b> its Library role may only add a Steward task and propose a fact; every read tool refuses it.</li>
<li><b>Long polling:</b> it asks Telegram for new messages — nothing listens on the internet, no new hostname.</li>
<li><b>Every outgoing message is checked:</b> the shared secret filter, a canary against leaking its own instructions, no links outside an allow-list, a length cap, plain text, link previews off. Tested with a deliberately obedient fake model that tries to print its prompt and the bot token.</li>
<li><b>Limits:</b> 6 answers per member an hour, 20 messages a minute, 300 model calls a day (<code>BK_COMMUNITY_DAILY_CALLS</code>), 300 tokens an answer.</li>
<li>It follows the off-switch: <code>BABYKALKI_STOP=1</code> + restart → Community desk: OFF.</li>
</ul>
<h4>Which model key?</h4>
<ul>
<li><b>Recommended:</b> a <b>separate pay-per-use key</b> with a spend cap, as <code>BK_COMMUNITY_LLM_KEY</code> (default Z.ai pay-per-use, glm-5.3-flash). A public bot serves other people.</li>
<li><b>No key:</b> fine — it replies with the best guide section and a link.</li>
<li><b>Prototype only, for a private test chat with yourself:</b> <code>BK_COMMUNITY_USE_CODING_PLAN=1</code> reuses your GLM Coding Plan key on the plan's Anthropic-compatible endpoint. Z.ai's Coding Plan terms do not allow bots that serve other people, and the bot then spends the same quota as your citizens — off by default. For any real group use retrieval-only or a separate pay-per-use key.</li>
<li><b>Honest note:</b> at launch the BabyKalki group's own desk runs with this prototype setting on the founder's key — his call, stated in the guide so you can judge it; the recommended setup for a group is the separate key above.</li>
</ul>
<h4>Setting it up (the L6 mission)</h4>
<ol class="steps">
<li>In <b>@BotFather</b>: <code>/newbot</code>, then <code>/setprivacy</code> → Disable. Put the token into Nimbuz Secrets yourself as <code>BK_TELEGRAM_BOT_TOKEN</code> — never paste it into the chat. The update must include <b>every</b> existing secret (Nimbuz replaces the whole map).</li>
<li>Add the bot to your group as an admin with only <i>Delete messages</i> and <i>Ban users</i>, and to a small private moderators' group; set <code>BK_TG_GROUP_IDS</code>, <code>BK_TG_ADMIN_CHAT_ID</code>, <code>BK_TG_ADMIN_IDS</code> and <code>BK_COMMUNITY_GUIDE_URL</code>.</li>
<li>Choose the model key (above); the Steward registers both keys in the Connections Register (names only).</li>
<li>Run <code>tests/test_telegram.py</code>, restart, and walk through the five "done when" checks with a second Telegram account.</li>
</ol>
<p class="status">What it keeps: daily counts (into the diary), member ids with join times and strikes for a day or two, and the text of escalated messages only. Members' other messages are not logged; questions it answers go to the model provider you chose — say so in your group's description. Not yet handled: edited messages are not moderated, and group admins must be listed in <code>BK_TG_ADMIN_IDS</code> to be exempt.</p>`,
  analogy: 'A key cabinet with a tag on every key: which door, who may borrow it, when it must be returned, and how to change the lock.',
  mistakes: ['Storing the secret value in the register. Only its NAME goes there.', 'Assuming a token on a private Free-plan repo can\'t push to main. Branch protection isn\'t enforced there.', 'Granting Gmail full-mail scope "to save time".', 'Running the public community desk on your personal Coding Plan key for real. It is a prototype-only opt-in; use a separate pay-per-use key with a cap.', 'Pasting the Telegram bot token into the Claude Code chat. It goes into Nimbuz Secrets, by you.'],
  teach: ['Have each learner fill one register row for a service they use (Gmail, say).', 'Ask: "How would you kill this key at 2 a.m.?" — if nobody knows, it is not ready.'],
  terms: ['Path A', 'Path B', 'Connections Register', 'Scope', 'Nimbuz Secrets', 'Fine-grained token', 'Branch protection', 'Community desk', 'BotFather', 'BK_COMMUNITY_USE_CODING_PLAN'],
  quiz: [
    { q: 'What does the Register store about a secret?', o: ['Its value', 'Its NAME and where it lives', 'A hash of your password', 'Nothing'], a: 1, why: 'The name only — never the secret itself.' },
    { q: 'Which Gmail permission does BabyKalki use?', o: ['Full mail access', 'Read + drafts only', 'Send only', 'Delete'], a: 1, why: 'Agents draft; you press Send.' },
    { q: 'A connection unused for 30 days…', o: ['is deleted silently', 'gets a revocation proposal from the Steward', 'is doubled', 'is ignored'], a: 1, why: 'Monthly review: unused 30 days → the Steward proposes revoking it.' },
    { q: 'On GitHub Free, is main protected on a private repo?', o: ['Yes, always', 'No — protection is not enforced on private repos on Free', 'Only on weekends', 'Only for bots'], a: 1, why: 'So use a public repo, a paid plan, or a separate agents repo.' },
    { q: 'You post in your group as an anonymous admin. Does the desk obey your /mute?', o: ['No, never', 'Yes — a message sent as the group counts as an admin (BK_TG_TRUST_ANON_ADMINS=1, the default)', 'Only in DMs', 'Only after a restart'], a: 1, why: 'Telegram hides an anonymous admin\'s user id, so the desk trusts messages sent as the group itself.' },
    { q: 'Which model key does the guide recommend for the community desk?', o: ['Your GLM Coding Plan key', 'A separate pay-per-use key with a spend cap', 'A friend\'s key', 'The Librarian\'s token'], a: 1, why: 'BK_COMMUNITY_USE_CODING_PLAN=1 is a prototype-only opt-in — personal-use plan, shared quota.' },
    { q: 'What may the community desk do in the Library?', o: ['Read every fact', 'Only add a Steward task and propose a fact — every read is refused', 'Commit facts', 'Approve drafts'], a: 1, why: 'Its own service role, community; it never sees your private facts.' },
    { q: 'The desk can\'t answer a question. What happens?', o: ['It guesses', 'It says it asked a human; your moderators\' chat and a Steward task receive it', 'It ignores the member', 'It bans the member'], a: 1, why: 'Escalation, with the member\'s text quoted as untrusted.' },
    { q: 'On Path B, can you add a GitHub or Gmail key today?', o: ['Yes, in the form', 'Not yet — the form has no fields for more keys; connections are a Path A step for now', 'Only through Telegram', 'Only on Pro'], a: 1, why: 'The Steward keeps the same Register on Path B, but there is no way to add connector keys yet.' },
    { q: 'Where does the bot token go?', o: ['Into the Claude Code chat', 'Into Nimbuz Secrets as BK_TELEGRAM_BOT_TOKEN, by you — with all the other secrets in the same update', 'Into AGENTS.md', 'Into the Library'], a: 1, why: 'Nimbuz replaces the whole Secrets map on an update that includes Secrets.' }
  ]
});

OK.chapters.push({
  id: 'usecases', n: 12, title: 'What to do with it: use cases', level: 'Use', mins: 8,
  breath: 'The same six citizens power five patterns — content studio, inbox and investor follow-ups, product building, market intelligence, operations — plus a bonus WhatsApp support bot, each with clear approval gates.',
  body: `
<p>Every use case follows one pattern: <b>connect → paste the mission → daily rhythm → approval gates</b>. These need the L4 connections <span class="tag plan">preview</span> — a Path A step. On <b>Path B — One-click on Nimbuz</b>, which cannot add connectors yet, use the chat-only parts: ask the citizens to <b>draft, review and remember</b> — a pitch email you then send yourself, a check of your deck's claims, your company's facts in the Library.</p>
{{dia:approval}}
<h3>1 · Content studio &amp; social media</h3>
<p><b>Who:</b> Scout (trends) → Builder as "Studio" (scripts, captions, image and video prompts) → Reviewer (brand, facts, rights) → Warden (your approval) → Steward (credits, scheduling). Librarian keeps brand voice and what worked.</p>
<p><b>Connect:</b> Kling AI and Runway through their official MCP servers with your own accounts and subscription credits; outputs expire after 24 hours, so the Steward saves them to Drive at once. One scheduling tool (e.g. Buffer, Metricool, Ayrshare) instead of four social APIs.</p>
<p><b>Rhythm:</b> 08:00 trend brief · 09:00 three draft posts + one storyboard · approval card on your phone · 19:00 results into the Library · weekly "what worked". <b>Gates:</b> every publish; paid generation above the cap; written consent for any real person's face or voice; AI media always labelled.</p>
<h3>2 · Inbox, sales &amp; investor follow-ups</h3>
<p>Warden triages, Scout researches each lead, Builder as "Writer" drafts, Reviewer checks tone and facts, Librarian keeps lead facts (<code>people:asha</code>, <code>company:acme</code>) and follow-up tasks. Gmail read + drafts, Calendar read-only, LinkedIn stays manual. <b>Gate:</b> the agents never send — you press Send.</p>
<h3>3 · Product building — your agent engineering team</h3>
<p>Warden turns voice notes into GitHub issues → Builder codes on a branch → Reviewer runs tests → <b>you merge</b>. A nightly build window (01:00–06:00 IST, when you're not using Claude Code — it's the same plan) and an 08:00 PR summary. Architecture decisions go into the Library under <code>decisions</code>.</p>
<h3>4 · Market, competitor &amp; fundraising intelligence</h3>
<p>Scouts in parallel → Reviewer grades every claim VERIFIED / CLAIMED / CONTRADICTED with source → Librarian supersedes, never overwrites → Warden sends a one-page Monday brief. Also: monthly investor and grant lists, and "red-team my deck" — the ten hardest investor questions.</p>
<h3>5 · Operations, finance &amp; admin</h3>
<p>Steward leads: Razorpay/Stripe read-only, your metrics Sheet, invoices. Friday MRR, churn and runway, checked twice by the Reviewer. A compliance calendar (GST, TDS, ROC filings) as tasks with reminders 14, 7 and 1 days before. <b>Gate:</b> never move money, never file anything.</p>
<h3>Bonus · Customer support on WhatsApp</h3>
<p>Possible — but a bot answering customers serves third parties, which the Coding Plan's personal-use terms don't cover. Use a <b>separate pay-per-use model key</b> with its own cap, the official WhatsApp Business Cloud API (Meta business verification first — allow more than a weekend), and hand over to a human for anything sensitive. It also processes customers' personal data.</p>`,
  analogy: 'One small staff, five different shifts — and the same rule on every shift: nothing goes out the door until the founder signs.',
  mistakes: ['Expecting agents to send emails or publish. They draft; you send.', 'Running the nightly build window while you use Claude Code yourself — same quota.', 'Running customer support on the personal Coding Plan.'],
  teach: ['Pick one use case per table group; have each group name its approval gates.', 'Ask: "Which use case stores other people\'s personal data?" (Inbox and support — read Personal data.)'],
  terms: ['Approval', 'Content studio', 'Build window', 'Red-team', 'Path B'],
  quiz: [
    { q: 'In the product-building use case, who merges a PR?', o: ['The Builder', 'The Reviewer', 'You', 'The Warden'], a: 2, why: 'Builder codes, Reviewer reviews — you merge. "Never merge."' },
    { q: 'Why do Kling/Runway outputs get saved to Drive at once?', o: ['They expire after 24 hours', 'Drive is cheaper', 'To share publicly', 'They are too big for R2'], a: 0, why: 'Outputs from both expire after 24 hours.' },
    { q: 'What must every piece of AI-generated media carry?', o: ['A price', 'A label saying it is AI-generated', 'A watermark of the Warden', 'Nothing'], a: 1, why: 'AI-generated media is always labelled; real faces/voices need written consent.' },
    { q: 'On Path B, which parts of the use cases can you use today?', o: ['All five, fully connected', 'The chat-only parts: drafting, reviewing and remembering', 'None at all', 'Only WhatsApp support'], a: 1, why: 'Path B has no fields for connector keys yet; the connected use cases need L4 on Path A.' },
    { q: 'What do agents do in the operations use case?', o: ['Move money and file taxes', 'Reminders and drafts only — never move money or file', 'Nothing', 'Approve invoices'], a: 1, why: 'Gates: agents never move money and never file anything.' }
  ]
});

OK.chapters.push({
  id: 'costs', n: 13, title: 'What it costs', level: 'Use', mins: 5,
  breath: 'Path A: about \$32 (≈ ₹3,700) a month always-on with the Lite plan if your citizens stay within its limits, or about \$94 (≈ ₹10,800) with Pro — recommended for six always-on citizens. Path B: about \$30 (≈ ₹3,200) on Lite or \$92 (≈ ₹10,300) on Pro — Nimbuz\'s ≈ \$12 (≈ ₹1,112) tool plus your Z.ai plan.',
  body: `
<p>The guide, the files and the prompts are free. You pay for your own services. Both paths pay for your Z.ai plan and one Nimbuz container; Path A adds a domain and free Cloudflare, Path B is just the one-click tool. Prices were checked on 17 Nov 2026 (Nimbuz size confirmed live 18 Nov; Path B's price as its form showed it on 22 Nov).</p>
<h3>Totals by path</h3>
<table class="tbl">
<tr><th>Setup</th><th>What's in it</th><th>USD / mo</th><th>≈ INR / mo</th></tr>
<tr><td>Path A — try it (L0–L2, light L3)</td><td>Lite + Nimbuz small.c (untested size) + domain + free Cloudflare + Telegram, sparse schedules</td><td>≈ 27</td><td>≈ 3,150</td></tr>
<tr><td>Path A — always on, on Lite</td><td>Lite + Nimbuz medium.r + ~10 GB + domain — only if citizens stay inside Lite's limits</td><td>≈ 32</td><td>≈ 3,700</td></tr>
<tr><td><b>Path A — recommended</b>: six always-on citizens</td><td>Pro + Nimbuz medium.r + ~10 GB + domain + free Cloudflare</td><td><b>≈ 94</b></td><td><b>≈ 10,800</b></td></tr>
<tr><td>Path A — with content studio</td><td>Recommended + Kling Standard + Runway Standard</td><td>≈ 119</td><td>≈ 13,700</td></tr>
<tr><td>Path B — try it, on Lite</td><td>Lite + the one-click tool on medium.r — only if citizens stay inside Lite's limits</td><td>≈ 30</td><td>≈ 3,200</td></tr>
<tr><td>Path B — six always-on citizens, on Pro</td><td>Pro + the one-click tool on medium.r</td><td>≈ 92</td><td>≈ 10,300</td></tr>
</table>
<p>Path B's rupee figures add the form's ₹1,112 (Nimbuz's rupee price, no card mark-up) to the Z.ai line below.</p>
<h3>The main line items</h3>
<ul>
<li><b>Z.ai GLM Coding Plan:</b> Lite \$18 (2,000 credits / 5 h, 10,000 / week); Pro \$80 (6× Lite's credits); Max \$168. Quarterly/yearly is cheaper.</li>
<li><b>Path A: Nimbuz app medium.r</b> (1 vCPU, 4 GB): \$12.00 — the size run live on 18 and 19 Nov 2026. small.c (2 GB) \$8.56 but untested and tight. Storage ~10 GB ≈ \$1.20.</li>
<li><b>Path B: the Nimbuz BabyKalki tool, medium.r</b> (1 vCPU, 4 GB): \$12.00 a month (\$0.0164 an hour, ≈ ₹1,112 in Nimbuz's rupee price), as the one-click form shows it — instead of all the Path A lines except your Z.ai plan. How the 10 GB volume and taxes show on the bill: check your first invoice.</li>
<li><b>Path A: domain:</b> .com at Cloudflare \$10.46 a year (≈ \$0.87/mo).</li>
<li><b>Free (Path A):</b> Claude Code, Cloudflare Tunnel + Zero Trust (≤ 50 users) + R2 (≤ 10 GB-month — but Cloudflare asks for a payment card before the first bucket), Telegram bot.</li>
<li><b>Optional:</b> Kling Standard ≈ \$10, Runway Standard \$15, WhatsApp Business ≈ \$0.1 founder-only, community desk answers (L6, Path A) ≈ \$0–5 (≈ ₹0–570) — Z.ai pay-per-use glm-5.3-flash was \$0.15 / \$0.50 per million tokens in / out on 19 Nov 2026, capped at 300 calls a day.</li>
</ul>
<h3>How the rupee column is worked out</h3>
<p>USD × ₹94 × 1.18 × 1.035 ≈ <b>₹114.8 per \$1</b>: the exchange rate that day, plus 18% GST on foreign digital services (OIDAR), plus a typical ~3.5% card forex mark-up. Paying Nimbuz in rupees by UPI avoids the card mark-up.</p>
<div class="callout"><b>Why Pro:</b> six always-on citizens, a nightly build window and your own Claude Code use all share one plan's 5-hour and weekly limits. Start on Lite with sparse schedules; move to Pro (≈ +\$62, ≈ +₹7,100 a month) when you hit the 5-hour limit. Nimbuz budgets only send alerts — they don't stop spending; your stop is pausing the app (or, on Path B, stopping the tool).</div>`,
  analogy: 'Like running a small office: rent (Nimbuz), electricity (the model plan), a nameplate (domain) and a free security guard (Cloudflare).',
  mistakes: ['Forgetting GST and card mark-up on USD services.', 'Expecting Nimbuz budgets to stop spending. They only alert.', 'Choosing small.m to save money — it was throttled even when idle.'],
  teach: ['Have learners compute their own INR total with the ×114.8 rule.', 'Ask: "What decides Lite vs Pro?" (Whether you hit the 5-hour limit.)'],
  terms: ['Lite plan', 'Pro plan', 'medium.r', 'OIDAR', 'Z.ai GLM Coding Plan', 'Path A', 'Path B'],
  quiz: [
    { q: 'On Path A, what is the recommended monthly cost for six always-on citizens?', o: ['Free', '≈ \$32', '≈ \$94', '≈ \$500'], a: 2, why: 'Pro + Nimbuz medium.r + storage + domain ≈ \$94 (≈ ₹10,800).' },
    { q: 'About how much is Path B a month with six always-on citizens on Pro?', o: ['≈ \$12', '≈ \$30', '≈ \$92 (≈ ₹10,300)', '≈ \$119'], a: 2, why: 'Pro (\$80) + the one-click tool on medium.r (≈ \$12, ≈ ₹1,112). On Lite it is ≈ \$30 (≈ ₹3,200).' },
    { q: 'Which Nimbuz size was run live?', o: ['small.m', 'small.c', 'medium.r', 'large.x'], a: 2, why: 'medium.r, 1 vCPU / 4 GB, ≈ \$12 a month.' },
    { q: 'Do Nimbuz budgets stop spending?', o: ['Yes', 'No — they only send alerts', 'Only on weekends', 'Only for storage'], a: 1, why: 'Your stop is pausing the app (Path A) or stopping the tool (Path B).' },
    { q: 'Roughly how many rupees per \$1 does the guide use, including GST and mark-up?', o: ['₹83', '₹94', '≈ ₹114.8', '₹150'], a: 2, why: '₹94 × 1.18 (GST) × 1.035 (card mark-up) ≈ ₹114.8.' }
  ]
});

OK.chapters.push({
  id: 'community', n: 14, title: 'Community and ecosystem', level: 'Use', mins: 5,
  breath: 'BabyKalki spreads from founder to founder: join t.me/babykalki (a desk bot answers from the guide, humans answer the rest), share what you built, report mistakes, fork it with credit, and run your own — there is no company to sign up with, nothing to buy, and no public code repository yet.',
  body: `
<div class="commcard"><img src="img/telegram-qr.svg" width="148" height="148" alt="QR code for t.me/babykalki"><div><b>Join the BabyKalki community on Telegram</b><p><a href="https://t.me/babykalki" rel="noopener">t.me/babykalki</a> — <b>@babykalki_bot</b> answers questions from the guide; humans answer the rest. Scan the code, or open <a href="/community/">the big printable QR page</a>.</p></div></div>
<h3>1 · Join and ask</h3>
<p>Open <code>t.me/babykalki</code>, read the pinned welcome and the rules (<code>/rules</code>); the group description has the guide, encyclopedia and status links. To ask the desk, <b>mention @babykalki_bot</b> or reply to one of its messages. It answers <b>only from the guide</b> and links the section it used; when the guide doesn't cover your question it says so and passes it to a human. It can be wrong — check the linked section. New members can post links and media after their first day (anti-spam). A plain "hi" or "thanks" gets a friendly reply, not an escalation.</p>
<h3>2 · Share your build</h3>
<p>Post your public status page (Path A: <code>https://www.yourdomain/status/</code>, or your site) and your citizens' names from your naming ceremony, with what worked, what broke and what it cost. <b>Never post</b> keys, passwords, your private dashboard's address (on Path B your Nimbuz address is the dashboard) or a login link, <code>/bk-login</code> links, or screenshots that show any of them. Posted a key by mistake? Delete the message and revoke the key.</p>
<h3>3 · Report a mistake or send a fix</h3>
<p>Found something wrong in the guide or the files? Reply to the message with <code>/report</code>, or post <b>"Erratum:"</b> with the section link. <b>There is no public code repository yet.</b> For a code fix, send an admin a zip of the changed files with a short note: what, why, and how you tested it (<code>tests/run_all.sh</code>). Accepted fixes are credited by name or handle in the guide's "What changed", unless you ask not to be named.</p>
<h3>4 · Help the next founder</h3>
<p>Answer what you know and link the guide section. When the desk says "I've asked a human", that human can be you. Questions the guide can't answer become new guide sections, so the desk gets better for everyone.</p>
<h3>5 · Fork, remix, teach</h3>
<p>Code, configs and prompts are <b>MIT</b>; the guide text and diagrams are <b>CC BY 4.0</b>; data is <b>CC0</b>. Translate it, teach it in a workshop, build a service on top. Please keep the <b>attribution line</b>:</p>
<div class="callout">Based on BabyKalki by Robin Dey — https://bk.openkalki.org/ (MIT / CC BY 4.0)</div>
<p>"BabyKalki" and "OpenKalki" are project names: say "based on BabyKalki", not "BabyKalki", and don't imply endorsement.</p>
<h3>6 · Spawn your own</h3>
<p>Run BabyKalki for your own startup — it is yours: your server (on Path B, your tool in your own Nimbuz account), your keys, your data, and <b>nothing reports back to us</b>. Stuck on either path? Ask in the group. With L6 (Path A — Path B has no Telegram desk of its own) your own public group gets a desk bot like ours, answering from your guide pages (<code>community-kb.md</code> plus your own <code>community-kb.founder.md</code>). With your <a href="#/c/dashboards">own website</a> on the same server, your BabyKalki can publish your project's site, as this one does.</p>
<h3>Events, and what is not built yet</h3>
<ul>
<li><b>Launch:</b> BabyKalki was launched at the Hyderabad Entrepreneurship Summit (<b>HES 2026</b>, TiE Hyderabad) on 20 Nov 2026, panel "Built to Last". Meet-ups and workshops will be announced in the Telegram group.</li>
<li><b>Not built yet — later:</b> founders' BabyKalkis joining OpenKalki as citizens, or talking to each other. It does not exist today; any such step will be opt-in and announced in the group first.</li>
<li><b>Who runs the group:</b> Robin Dey, with the desk bot — the same <code>bk_telegram.py</code> that is in the zip, running on the founder's own BabyKalki. What the bot keeps: daily counts, member ids with join times and strikes for a day or two, and the text of escalated messages only (see <a href="#/c/connections">Connections</a>).</li>
<li><b>Honest note:</b> the group's own desk runs with the <i>prototype</i> Coding Plan setting on the founder's key — his call, stated in the guide so you can judge it. For your group the guide recommends a separate pay-per-use key, or no key at all.</li>
</ul>
<p class="status">Share the guide with a plain link: <code>https://bk.openkalki.org/</code> — the guide page has WhatsApp, Telegram and LinkedIn share links (plain links, no tracking).</p>`,
  analogy: 'A recipe passed between cooks: anyone can cook it in their own kitchen, swap tips at the market (the Telegram group), send a correction to the author — and when you publish your version, you write "after Robin\'s recipe".',
  mistakes: ['Posting a /bk-login link or a key in the group. Delete it and revoke the key.', 'Looking for a GitHub repo to open a pull request. There is no public code repository yet — send a zip and a note to an admin.', 'Calling your fork "BabyKalki". Say "based on BabyKalki", keep the attribution line, and don\'t imply endorsement.', 'Thinking your BabyKalki reports to Robin or OpenKalki. Nothing reports back; joining OpenKalki is not built yet and will be opt-in.', 'Treating the desk bot\'s answer as final. It answers from the guide only and can be wrong — check the linked section.'],
  teach: ['End every workshop by showing the QR code and asking each learner to post one question in the group.', 'Ask: "What three things must never appear in a screenshot you share?" (Keys, a /bk-login link, your private dashboard with a login link.)'],
  terms: ['Path B', 'Community group', 'QR code', 'Erratum', 'Attribution line', 'Fork', 'HES 2026', 'Community desk'],
  quiz: [
    { q: 'How do you ask the desk bot a question in the group?', o: ['Email Robin', 'Mention @babykalki_bot or reply to one of its messages', 'Post in all caps', 'You can\'t'], a: 1, why: 'It answers only from the guide and links the section; otherwise it passes your question to a human.' },
    { q: 'Where is BabyKalki\'s code repository?', o: ['On GitHub', 'There is no public code repository yet — the files come as one checked zip', 'On npm', 'On Nimbuz'], a: 1, why: 'For a code fix, send an admin a zip of the changed files with a note: what, why and how you tested it.' },
    { q: 'You publish a remix of the guide. What do you keep?', o: ['Nothing', 'The attribution line: "Based on BabyKalki by Robin Dey — https://bk.openkalki.org/ (MIT / CC BY 4.0)"', 'Robin\'s phone number', 'The BabyKalki name alone'], a: 1, why: 'Code is MIT, text CC BY 4.0, data CC0; say "based on BabyKalki" and don\'t imply endorsement.' },
    { q: 'Does your own BabyKalki report back to Robin or OpenKalki?', o: ['Yes, daily', 'No — your server, your keys, your data; nothing reports back', 'Only the costs', 'Only on Telegram'], a: 1, why: 'Founders joining OpenKalki as citizens is not built yet and will be opt-in.' },
    { q: 'Which of these is safe to share in the group?', o: ['A /bk-login link', 'Your public status page and your citizens\' names', 'Your Z.ai key', 'A screenshot of Nimbuz Secrets'], a: 1, why: 'Share what worked, what broke and what it cost — never keys or login links.' },
    { q: 'Can you run your own Telegram community desk on Path B?', o: ['Yes, it is in the form', 'Not yet — the desk is an optional L6 step on Path A', 'Only with WhatsApp', 'Only for admins'], a: 1, why: 'Path B has no field for a bot token; the desk stays OFF. You can still join and ask in t.me/babykalki.' },
    { q: 'Where was BabyKalki launched?', o: ['Web Summit, Lisbon', 'HES 2026 (TiE Hyderabad), 20 Nov 2026, panel "Built to Last"', 'Nowhere yet', 'At ESA'], a: 1, why: 'Meet-ups and workshops will be announced in the Telegram group.' }
  ]
});

OK.chapters.push({
  id: 'safety', n: 15, title: 'Safety: enforced vs advisory', level: 'Trust', mins: 8,
  breath: 'A promise in a prompt is not a lock — so for every headline promise BabyKalki says whether code enforces it, how we know, and where the limits are.',
  body: `
<h3>Eight safety habits</h3>
<ul>
<li><b>Two locks</b> on the private dashboard: Cloudflare Access + dsh login (Path B: a founder username and password plus the same dsh login; a forged Cloudflare header is ignored — tested 22 Nov 2026).</li>
<li><b>Least privilege — stated honestly:</b> Gmail drafts not send, payments read-only, GitHub on one repo.</li>
<li><b>Drafts, PRs and approvals:</b> a citizen requests an approval with the exact draft text; only you decide, on <code>/bk-approve</code>; the Library keeps the text and its SHA-256 so anyone can re-check it.</li>
<li><b>An off-switch that needs no AI</b> (Path B: stop the tool in Nimbuz) — and nothing goes back to DeepSeek (telemetry off).</li>
<li><b>No secrets in memory:</b> one shared filter; infra secrets belong to a separate user.</li>
<li><b>Honest media:</b> label AI images and video; written consent for real faces and voices; respect music and image rights.</li>
<li><b>Untrusted web and mail:</b> treated as data, never as instructions. Anything that asks to send, pay or share goes to you.</li>
<li><b>Your data stays yours</b> — your backups are plain files in your own bucket (Path A; on Path B they sit on the tool's volume in your Nimbuz account), and the nightly mirror is planned.</li>
</ul>
<h3>The honesty table</h3>
<p>These rows describe <b>Path A</b> (Cloudflare in front); the Path B rows follow below. Everything inside the container — the Library, approvals, the Librarian round, secrets — is the same kit on both paths.</p>
<table class="tbl">
<tr><th>Promise</th><th>Status</th></tr>
<tr><td>Private dashboard never public without login</td><td><span class="tag live">ENFORCED</span> dry run on a test domain (Access + dsh login)</td></tr>
<tr><td>dsh login link never in a log</td><td><span class="tag live">ENFORCED + live</span></td></tr>
<tr><td>Public page shows only safe data</td><td><span class="tag live">ENFORCED</span> served live on Nimbuz</td></tr>
<tr><td>Only the Librarian commits facts</td><td><span class="tag live">ENFORCED (v0.5)</span> Librarian round under its own user; tested locally, with real dsh, and on Nimbuz (v0.4: advisory — any session could commit)</td></tr>
<tr><td>Only you approve (rule 1's gate)</td><td><span class="tag live">ENFORCED (v0.5)</span> /bk-approve, founder emails only, with user separation; forged header → 403 on Nimbuz; Approve click in a browser to verify</td></tr>
<tr><td>Each of the other five citizens speaks to the Library as itself</td><td><span class="tag plan">ADVISORY</span> presets narrow it; the five tokens share one dsh process</td></tr>
<tr><td>Facts corrected, never erased</td><td><span class="tag live">ENFORCED</span> no delete tool</td></tr>
<tr><td>A miss says MISS</td><td><span class="tag live">ENFORCED</span></td></tr>
<tr><td>No secrets in Library / diary</td><td><span class="tag live">ENFORCED filter</span> not perfect</td></tr>
<tr><td>Diary is tamper-evident</td><td><span class="tag build">PARTLY</span> before the last anchor only</td></tr>
<tr><td>Backups can't destroy data</td><td><span class="tag live">ENFORCED + live (MinIO)</span> real R2 untested</td></tr>
<tr><td>Only one running copy, even during a restart</td><td><span class="tag live">ENFORCED + live</span> not a perfect lock; v0.5 race fix (time-boxed heartbeats, <code>BK_LEASE_CONFIRM_S</code> 5 s)</td></tr>
<tr><td>You approve everything that leaves</td><td><span class="tag build">PARTLY</span> the approval itself is yours alone; scopes are technical; a citizen with a shell could still send without asking</td></tr>
<tr><td>Off-switch</td><td><span class="tag live">ENFORCED</span> tested locally + dry run on Nimbuz</td></tr>
<tr><td>Infra secrets hidden from citizens</td><td><span class="tag live">ENFORCED + live</span></td></tr>
<tr><td>Nothing goes back to DeepSeek</td><td><span class="tag live">ENFORCED (v0.5)</span> env forced off + eight config rows; the web-UI switch is your check</td></tr>
<tr><td>Community desk can't reach citizens, keys or private facts</td><td><span class="tag live">ENFORCED (tested locally)</span> own user bkcomm, task-only Library role; running live in t.me/babykalki — the live checks: to verify</td></tr>
<tr><td>The dashboard panel shows only your own citizens and links</td><td><span class="tag live">ENFORCED by design (tested locally)</span> the browser plugin is root-owned, filled in at start, sends nothing anywhere — but it is a convenience, not a lock</td></tr>
<tr><td>Per-citizen tools / model tier</td><td><span class="tag plan">ADVISORY</span> each preset = dsh's standard tool set; extras are rules in AGENTS.md; all six on GLM-5.3</td></tr>
<tr><td>≤ 2–3 citizens at once, quota</td><td><span class="tag plan">ADVISORY</span> no quota API yet</td></tr>
<tr><td>Your Nimbuz login stays away from citizens</td><td><span class="tag plan">ADVISORY — your job</span></td></tr>
<tr><td>Mail reader can't leak to the web</td><td><span class="tag plan">ADVISORY</span> dsh has no network sandbox</td></tr>
</table>
<h3>Path B — One-click on Nimbuz (tested 22 Nov 2026)</h3>
<table class="tbl">
<tr><th>Promise</th><th>Status</th></tr>
<tr><td>Path B: private dashboard never open without login</td><td><span class="tag live">ENFORCED (live on Path B)</span> without the password every path refused: <code>/</code>, the dsh API and websocket → dsh's login; <code>/bk-login</code>, <code>/bk-approve</code> and path tricks → the founder password; valid HTTPS certificate, <code>http://</code> redirects</td></tr>
<tr><td>Path B: only you approve</td><td><span class="tag live">ENFORCED (live on Path B)</span> a forged <code>Cf-Access-Authenticated-User-Email</code> header is ignored (the page still names the configured founder); no CSRF token, another site's Origin or a changed text hash → 403; a real approval was recorded and matched by the Librarian</td></tr>
<tr><td>Path B: wrong passwords are limited</td><td><span class="tag build">NOT ENFORCED</span> 25 wrong tries in a row were all just refused — no lockout, no rate limit. Use a long, unique password</td></tr>
<tr><td>Path B: backups survive losing the server</td><td><span class="tag build">NOT PROVIDED</span> snapshots go to the same volume as the data; deleting the tool deletes them. The hourly snapshot and a restore: to verify</td></tr>
</table>
<p>Also seen on Path B: 0 log lines contained the password, the Z.ai key or the login link; the web dsh holds the citizens' Library keys but not the Librarian's commit key or the approvals key, the same as Path A. <span class="tag plan">to verify</span>: the hourly snapshot, a restore from a snapshot, and how Nimbuz updates existing installs. Missing for now: a status page and off-site backups (see <a href="#/c/cloud">chapter 9</a>).</p>
<p class="status">"Tested locally" = the 269 automated tests pass with local stand-ins for R2 and dsh. "Live" = checked on Nimbuz (18–20 Nov 2026) with the real image and real dsh; "dry run" = followed end to end on 19 Nov with thinking citizens (GLM-5.3), a test domain, a named tunnel + Access, and MinIO standing in for R2. Real R2 is not yet tested.</p>
<h3>Enforced vs advisory — the short version</h3>
<table class="tbl">
<tr><th>ENFORCED by code</th><th>ADVISORY (rule or convenience)</th></tr>
<tr><td>Commits only in the Librarian round · approvals only by you on /bk-approve · telemetry off · infra and community secrets hidden from citizens · off-switch · two locks · backups copy, never sync (Path A) · on Path B: the founder password in front, forged headers ignored</td><td>Which of the other five citizens a session acts as (presets, the panel and the mode menu only narrow what it sees) · sending without asking (a shell can still reach the net) · quota and "2–3 citizens at once" · the mail reader staying off the web</td></tr>
</table>
<div class="callout gold"><b>Know the limits.</b> BabyKalki is built on developer-preview software (dsh is explicitly a preview with breaking changes). Six citizens share one dsh process and one filesystem. Do not connect anything you could not afford to have misused, and keep the number of connections small.</div>`,
  analogy: 'A building inspector\'s report that says not just "fire safe", but which doors are fire-rated, which are just signed "keep closed", and which haven\'t been inspected yet.',
  mistakes: ['Reading ADVISORY as "enforced". It is a prompt rule only.', 'Thinking the boot lease is a perfect lock. R2 has no compare-and-swap; it is good enough for restarts.', 'Connecting a high-risk account because "the agents will be careful".', 'Reading the preset menu or the BabyKalki panel as a wall. Which of the other five citizens a session acts as is still ADVISORY.'],
  teach: ['Give learners five promises and have them guess the label, then reveal the table.', 'Explain "not a security boundary": it stops mistakes, not a determined citizen with a shell.'],
  terms: ['Path A', 'Path B', 'Founder password', 'Enforced', 'Advisory', 'Approvals register', 'Prompt injection', 'Least privilege', 'bk-approve', 'BK_FOUNDER_EMAILS', 'Legacy approval'],
  quiz: [
    { q: 'What does ADVISORY mean in the table?', o: ['Enforced by code', 'A prompt rule only', 'Not allowed', 'Tested live'], a: 1, why: 'A promise in a prompt is not a lock.' },
    { q: 'How do agents treat instructions found in emails or web pages?', o: ['Follow them', 'As data, never as instructions', 'Forward them to the Scout', 'Delete them'], a: 1, why: 'Anything asking to send, pay or share goes to you.' },
    { q: 'Has BabyKalki been tested with thinking citizens yet?', o: ['No, never', 'Yes — in the 19 Nov dry run all six answered on GLM-5.3', 'Only the Warden', 'Only on Windows'], a: 1, why: 'The dry run used a real Z.ai key; L4 connectors and real R2 are still to verify.' },
    { q: 'Which promises became ENFORCED in v0.5?', o: ['Quota per citizen', 'Only the Librarian (round) commits, only you approve, nothing goes to DeepSeek', 'Mail reader can\'t reach the web', 'Every citizen speaks as itself'], a: 1, why: 'The other five citizens\' identity, quota and mail-reader rules stay ADVISORY.' },
    { q: 'BK_FOUNDER_EMAILS is empty. Who can approve on /bk-approve?', o: ['Everyone', 'Nobody — the status page says NO_FOUNDER_EMAILS', 'The Warden', 'The Steward'], a: 1, why: 'Set it to the email you log in with through Cloudflare Access.' },
    { q: 'On Path B, what happens after 25 wrong founder passwords in a row?', o: ['The account locks for an hour', 'Nothing — each is just refused; there is no lockout, so use a long, unique password', 'Nimbuz emails you', 'The tool deletes itself'], a: 1, why: 'Tested 22 Nov 2026: NOT ENFORCED. The password is Path B\'s only outer lock.' },
    { q: 'Which promise is NOT PROVIDED on Path B?', o: ['Only you approve', 'Backups that survive losing the server', 'A miss says MISS', 'No page opens without a login'], a: 1, why: 'Its snapshots sit on the same volume as the data; deleting the tool deletes them.' },
    { q: 'Which promise is only PARTLY enforced?', o: ['A miss says MISS', 'Diary is tamper-evident', 'Infra secrets hidden', 'Facts never erased'], a: 1, why: 'Edits before the last off-site anchor show; a same-user rewrite after it does not.' }
  ]
});

OK.chapters.push({
  id: 'data', n: 16, title: 'Personal data', level: 'Trust', mins: 4,
  breath: 'The diary keeps every session event verbatim — including emails a citizen reads — so it is sent to the model provider and backed up: to your R2 on Path A, to the tool\'s own volume on Path B; erasure is done by tombstones, with your approval.',
  body: `
<h3>Where it goes</h3>
<ul>
<li>The diary stores every session event <b>verbatim</b> — including the text of any email a citizen reads — after secret redaction.</li>
<li>That text is sent to the <b>model provider (Z.ai)</b> as conversation context, and stored off-site in your <b>R2 bucket</b> with the backups (Path A; on Path B, in the snapshots on the tool's own volume).</li>
<li><b>Community desk</b> (v0.5, if you turn it on): Telegram member ids with join times and strike counts for a day or two (to stop spam), daily counts in the diary, and the text of escalated messages only — in your moderators' chat and the Steward's task. Other messages are not logged; questions it answers go to the model provider you chose for it. Say so in your group's description.</li>
<li><b>Path A:</b> on Nimbuz the container runs in <b>Mumbai</b>; your uploaded zip and built image are stored in <b>AWS Singapore</b>. Your data itself lives in the container and your R2 bucket.</li>
<li><b>Path B:</b> the tool, its volume and its snapshots run in the <b>region of the environment you pick</b> (we used <code>ap-south-1</code>, Mumbai); there is <b>no R2</b>. Deleting the tool deletes all of it. Your Z.ai key and founder password sit in the tool's settings, which Nimbuz's API shows in plain text to your Nimbuz login.</li>
</ul>
<h3>How to erase</h3>
<ol class="steps">
<li>The Librarian round, with your <b>approval from /bk-approve</b>, replaces a diary entry by a <b>tombstone</b> that keeps only the SHA-256 of the original — so the hash chain stays verifiable.</li>
<li>Related facts are <b>retired</b>.</li>
<li>R2 snapshots that still contain the old text age out by pruning (within 8 weeks) — or delete them by hand for an urgent request (Path A). On Path B the old text also sits in the snapshots on the tool's volume; how they are pruned there is to verify.</li>
</ol>
<h3>India's DPDP Act 2023</h3>
<p>If you process other people's personal data (leads, customers, investors), you are a <b>Data Fiduciary</b>. Keep only what you need, tell people, and honour erasure requests. <i>This is not legal advice.</i></p>
<p>The <code>CLAUDE.md</code> in the zip says the same, so Claude Code reminds you when you connect an inbox.</p>`,
  analogy: 'A visitor\'s book you can\'t tear pages from — but you can paste a sealed sticker over one entry, leaving only its fingerprint, so the page numbering still adds up.',
  mistakes: ['Thinking only facts are stored. The diary keeps every event verbatim, including emails read.', 'Forgetting the R2 backups when erasing — old snapshots need to age out or be deleted.'],
  teach: ['Trace one email: inbox → diary → Z.ai context → R2 snapshot → tombstone.', 'Ask: "Are you a Data Fiduciary?" for each use case.'],
  terms: ['Tombstone', 'DPDP Act', 'Data Fiduciary', 'Diary', 'Path A', 'Path B'],
  quiz: [
    { q: 'How is a diary entry erased?', o: ['The file is deleted', 'Replaced by a tombstone keeping only its SHA-256', 'It cannot be', 'By the Scout'], a: 1, why: 'The hash chain stays verifiable; it needs your approval from /bk-approve, and the Librarian round does it.' },
    { q: 'On Path A, where does diary text go besides the container?', o: ['Nowhere', 'To Z.ai as context and to R2 with backups', 'To Telegram', 'To GitHub publicly'], a: 1, why: 'Model context and off-site backups.' },
    { q: 'On Path B, where do the backups of your diary and Library live?', o: ['In your R2 bucket', 'In snapshots on the tool\'s own volume, in the region of your Nimbuz environment', 'On the guide authors\' server', 'Nowhere'], a: 1, why: 'There is no R2 on Path B; deleting the tool deletes the snapshots too.' },
    { q: 'Under India\'s DPDP Act, processing leads\' data makes you a…', o: ['Data Fiduciary', 'Data Broker', 'Data Miner', 'Nothing'], a: 0, why: 'Keep only what you need, tell people, honour erasure requests.' }
  ]
});

OK.chapters.push({
  id: 'lessons', n: 17, title: 'War stories: lessons from The Beast', level: 'Trust', mins: 4,
  breath: 'Every BabyKalki rule comes from something that went wrong in a real always-on agent system — forgetting, full disks, runaway costs, duplicate bots, sleeping laptops and never-restored backups.',
  body: `
<table class="tbl">
<tr><th>It hurt</th><th>So BabyKalki…</th></tr>
<tr><td>Agents forgot what they'd agreed yesterday — they only remembered what they chose to write down, and forgot to write exactly when they crashed.</td><td>writes the diary <b>automatically</b> from every event, with no model in the loop.</td></tr>
<tr><td>A full disk emptied a memory file to zero bytes in the middle of a write.</td><td>uses <b>atomic writes</b> (temporary file, flush, rename), log rotation, disk alarms, and refuses writes before the disk is full.</td></tr>
<tr><td>Costs ran away, and weekly usage limits stopped everything at the worst moment.</td><td>has the Steward <b>cap every connection</b>; sparse schedules and at most 2–3 citizens at once (a rule — not yet enforced); an off-switch that works even when the quota is gone.</td></tr>
<tr><td>Two copies of the same bot ran at once and argued — each overwriting the other's work.</td><td>keeps <b>one daemon per job, one writer for memory, one front desk</b>. A lock, not a re-read. (Nimbuz restarts briefly run two copies — so v0.3 added the boot lease; the 19 Nov dry run confirmed it; and when a flaky test showed a slow heartbeat could still leave two copies both "holding" it, v0.5 time-boxed the heartbeat instead of hoping.)</td></tr>
<tr><td>A laptop went to sleep, and the "always-on" system went with it.</td><td>has <b>the laptop build; a small cloud server runs</b>. Nothing important lives only on your laptop.</td></tr>
<tr><td>A promise written in a prompt ("only the Librarian commits") was broken the first evening a founder used it: every session could see the Librarian's key.</td><td>moves the key out of reach — <b>the Librarian round</b> — and lists every promise as ENFORCED or ADVISORY.</td></tr>
<tr><td>Backups existed — but nobody had ever restored one.</td><td>runs a <b>restore test</b> comparing counts and hashes every week. A backup never restored does not count. (That is why Path B, whose restore we have not tested yet, is for trying — not for your only copy.)</td></tr>
</table>
<div class="callout"><b>"A lock, not a re-read."</b> If two copies both check "is anyone else writing?" and then both write, the last writer wins and each one's self-check passed. Only a real lock prevents it.</div>`,
  analogy: 'Like aviation checklists: every line exists because, somewhere, a plane once went down without it.',
  mistakes: ['Treating these rules as over-engineering. Each one paid for itself in a real failure.', 'Thinking "check before you write" prevents duplicate writers. It doesn\'t — you need a lock.'],
  teach: ['Tell one story, then ask the group to guess the rule before revealing it.', 'Map each lesson to a chapter: diary → Memory; lease → Always on; restore test → Backups.'],
  terms: ['The Beast', 'Atomic write', 'Boot lease', 'Restore test'],
  quiz: [
    { q: 'What lesson produced the automatic diary?', o: ['Runaway costs', 'Agents forgetting, especially when they crashed', 'Sleeping laptops', 'Full disks'], a: 1, why: 'They only remembered what they chose to write down.' },
    { q: 'What prevents two copies of a bot overwriting each other?', o: ['Re-reading before writing', 'A lock (one daemon, one writer, a boot lease)', 'Faster servers', 'More citizens'], a: 1, why: '"A lock, not a re-read."' },
    { q: 'Why does the laptop only build, not run?', o: ['Laptops are slow', 'A laptop went to sleep and the system went with it', 'Claude Code forbids it', 'Cost'], a: 1, why: 'Nothing important lives only on your laptop.' }
  ]
});

OK.chapters.push({
  id: 'status', n: 18, title: 'What\'s verified, what\'s next', level: 'Trust', mins: 6,
  breath: 'BabyKalki v1.3 (22 Nov 2026): two paths — Path A — Build it yourself with Claude Code, and Path B — One-click on Nimbuz, tested end to end on 22 Nov 2026. 269 automated tests pass; L3 passed an automated Nimbuz dry run; the founder\'s own BabyKalki runs live on Nimbuz — it serves bk.openkalki.org and the Telegram desk in t.me/babykalki; commits, approvals and "nothing to DeepSeek" are enforced since v0.5; the dashboard panel is checked locally. Still to verify: the dashboard and the Approve click in a live browser on Path A, the desk\'s full checklist, schedules, real R2, L2 on a laptop, L4 connectors — and on Path B the hourly snapshot, a restore and how installs get updated.',
  body: `
<p>Status words, used the same way everywhere: <span class="tag live">tested locally</span> = the automated tests pass on our machine; <span class="tag live">live</span> = checked on Nimbuz with the real image and real dsh; <span class="tag plan">to verify</span> = not yet checked (not "broken"); <span class="tag plan">preview</span> = described, not yet tested end to end.</p>
<h3>Verified</h3>
<ul>
<li><span class="tag live">tested locally</span> <b>269 automated tests pass</b> (v0.5: 190; v0.4: 118; v0.3: 109), run from the zip itself — the Library, backup/restore, the boot lease (incl. the lease-race tests), the diary, the secret filter, the status publisher, the static server and your website, the approvals page, the Librarian round, citizen presets, the dashboard config and browser module, the supervisor and the community desk (fake Telegram, fake model) — with local stand-ins for R2 and dsh and real separate Linux users.</li>
<li><span class="tag live">dry run on Nimbuz, 19 Nov 2026</span> an agent followed the guide (medium.r, real Z.ai key, test domain, MinIO standing in for R2): six thinking citizens, backup → restart → restore, the boot lease, wrong-key refusal, named tunnel, both locks, public status page, both off-switches — PASS after two blocking fixes (zip root, default model), shipped in v0.4.</li>
<li><span class="tag live">live, by the founder, 19 Nov 2026</span> the browser login via <code>/bk-login</code> and the <b>naming ceremony</b> — PASS. The same test found two holes (any session could commit through the Librarian's connector, and any session could record an approval); both closed in v0.5.</li>
<li><span class="tag live">v0.5 on Nimbuz, 19–20 Nov 2026</span> uploaded unchanged to a staging app, then used to upgrade a live instance: 0 activation errors; presets and the telemetry rows in dsh's composed config; commits only in the Librarian round (every other token REFUSED); <code>/bk-approve</code> refused a service token and a forged header from a citizen's shell; backup → restart → restore with a clean lease handover; a v0.4 Library restored intact.</li>
<li><span class="tag live">Telegram desk live, since 20 Nov 2026 03:52 UTC</span> in <code>t.me/babykalki</code>, on the founder's instance: status page <i>Community desk: ON</i>, the first escalation reached the Steward as a Library task, the bot token never in logs or on the status page; a greeting fix ("hi" and "thanks" get a reply, not an escalation) went live the same morning.</li>
<li><span class="tag live">public website live, since 20 Nov 2026 04:15 UTC</span> <code>bk.openkalki.org</code> is served by the founder's own BabyKalki (v0.6 <code>bk_static.py --www</code>): the guide, the files, this encyclopedia, <code>/status/</code> (never cached, strict CSP), <code>/status.json</code>, <code>/health</code>, a 404 page; checked from outside through Cloudflare — the guide, the files page and this encyclopedia opened in a browser with 0 console errors.</li>
<li><span class="tag live">v0.7 live, 20 Nov 2026 06:55 UTC</span> the community page and QR code, and the dashboard's start-up check on the live instance: panel ON, seven slash commands installed, only GLM models, DeepSeek account settings disabled, six citizen presets, telemetry off; clean lease handover.</li>
<li><span class="tag live">Path B — One-click on Nimbuz, tested end to end, 22 Nov 2026</span> (kit v1.1 inside): two installs from the form and two from Nimbuz's API — running about a minute after Submit; the founder password (the browser asks) in front of <code>/bk-login</code> and <code>/bk-approve</code> and dsh's own login on everything else; a forged <code>Cf-Access</code> header ignored; CSRF, Origin and text-hash checks → 403; the one-time login link; the naming ceremony; the Warden, the Librarian and the Steward answering on GLM-5.3; a Library fact committed and kept across three restarts; an approval clicked on <code>/bk-approve</code> and matched by the Librarian; about 30–40 s offline per restart with a clean hand-over; 0 secrets in the logs.</li>
<li><span class="tag live">dashboard, checked locally</span> on real dsh 0.2.2-rc.3 with a headless browser: brand, panel, citizen workspaces, home page, mode menu with six citizens, GLM-only picker, the switched-off DeepSeek parts — and the dsh login cookie surviving a restart.</li>
</ul>
<h3>Not verified yet</h3>
<ul>
<li><b>In a browser on the live instance</b> (they need the founder's email code): how the dashboard looks there, a real GLM turn in each citizen's session, and the <b>Approve click</b> on <code>/bk-approve</code>.</li>
<li><b>The desk's full L6 checklist</b> on real Telegram with a second account: the welcome and the first-day link removal, a written answer vs "I've asked a human", <code>/mute</code> by a non-admin vs an admin, and the off-switch. So far check (1) passed live; the rest are covered by the automated tests. How well it answers short questions is being tuned on the live group; when it is unsure it hands over to a human rather than guess.</li>
<li>The dsh login cookie surviving a restart <i>live</i>; the first scheduled delivery (08:00 briefing, triage).</li>
<li><b>Path B:</b> the hourly snapshot (the test ran under an hour after the last restart), a restore from a snapshot (the disk was never empty), and how Nimbuz updates the image of an existing install. Known gaps, not "to verify": no status page (the panel's link is broken), backups only on the same volume, no lockout after wrong passwords, no Telegram desk, no custom domain or website, no connector-key fields, version chosen by Nimbuz. Moving from Path B to Path A: not tested — a migration guide is coming.</li>
<li>Real Cloudflare R2 (needs a payment card; MinIO stood in); L2 on a laptop; L4 connectors (incl. the Warden's own Telegram bridge, which is not in the files); "public networking OFF" on Nimbuz; a crash-style kill on Nimbuz.</li>
</ul>
<h3>What changed recently</h3>
<ul>
<li><b>v1.3 (22 Nov) — two paths, side by side.</b> Two equal ways to get BabyKalki, with the same names everywhere: <b>Path A — Build it yourself with Claude Code</b> and <b>Path B — One-click on Nimbuz</b>; which to pick, "can I switch later?" (yes; a migration guide is coming), Path B step by step with its limits, and every section saying which path it describes. Kit files: version number only.</li>
<li><b>v1.2 (22 Nov, morning) — one-click on Nimbuz.</b> Nimbuz runs BabyKalki from one form in its catalogue; tested end to end on 22 Nov 2026.</li>
<li><b>v1.1 (20 Nov, afternoon) — the desk thinks.</b> The community desk answers in plain words on GLM-5.3, with the guide as background, a short memory, and admin-taught answers.</li>
<li><b>v1.0 (20 Nov) — the first shareable release.</b></li>
<li><b>v0.7 (20 Nov, morning) — the community and your dashboard.</b> A Telegram group with a QR code and a <code>/community/</code> page; a "Community and ecosystem" section; the desk live in the group; the BabyKalki panel, citizen workspaces, the Warden as default, seven slash commands, DeepSeek account/feedback/plugin parts switched off (new kit files <code>bk_dash.py</code>, <code>dash/</code>); the dsh login survives restarts; one version number and the counted test total everywhere.</li>
<li><b>v0.6 (20 Nov, early) — your own website.</b> <code>site/www/</code> served at <code>/</code>, the status page at <code>/status/</code>, own-files-only CSP, caching; bk.openkalki.org itself is served this way.</li>
<li><b>v0.5 (19–20 Nov) — enforced commits and approvals.</b> Only the Librarian round commits (user <code>bklib</code>); only you approve, on <code>/bk-approve</code>; citizen presets; nothing goes to DeepSeek; a boot-lease race fix; the optional Telegram community desk (L6).</li>
<li><b>Earlier:</b> v0.4 fixed what the dry run found (zip root, default-model row, Nimbuz traps, <code>BK_AGENT_HOST</code>, <code>BK_CLEAR_STOP</code>); v0.3 added the boot lease; v0.2 was the rebuild after review. The full history is on the guide's <i>changes</i> page.</li>
</ul>
<h3>Versions pinned</h3>
<p>Node base image by digest; dsh 0.2.2-rc.3; cloudflared 2026.11.1; rclone v1.76.0; GitHub MCP server v2.2.0 (each with a SHA-256 check); ladybug 0.22.3; mcp 2.3.0. The files zip is <code>babykalki-files-v1.3.zip</code> with SHA-256 <code>13eadd41…f64898f</code> (full hash on the guide page) — its files sit at the zip root, so unzip into a new, empty folder.</p>
<h3>What comes next</h3>
<ul>
<li><b>Close the remaining "to verify" items</b> above — in the open, in the Telegram group.</li>
<li><b>The community</b> — <code>t.me/babykalki</code>: updates, new versions and founders' questions, with the desk bot answering from the guide. See <a href="#/c/community">Community and ecosystem</a>.</li>
<li><b>OpenKalki citizenship</b> — founders who build a BabyKalki will be able to join OpenKalki as citizens <span class="tag plan">not open yet</span>; it will be opt-in and announced in the group.</li>
</ul>
<h3>Licence</h3>
<p>Code, configs and prompts: <b>MIT</b>. Guide text and diagrams: <b>CC BY 4.0</b>. Data: <b>CC0</b>. © 2026 Robin Dey. Cite as: Dey, R. (2026), BabyKalki v1.3, https://bk.openkalki.org/.</p>`,
  analogy: 'A test-flight log: ground tests passed, a full test flight passed after two fixes, the owner has now flown it every day — it carries its own website and answers the passengers\' phone — while a few instruments (the live Approve button, the full phone checklist, real R2) are still marked "not yet checked".',
  mistakes: ['Saying "Path B is the same as Path A". Same citizens, Library, approvals and dashboard — but backups on the same disk, no status page, no lockout after wrong passwords, no Telegram desk or own domain.', 'Saying "BabyKalki is fully tested". L3 passed a dry run and the founder\'s instance runs live, but the live Approve click, the desk\'s full checklist, schedules and real R2 are still to verify, and L4–L5 are preview.', 'Saying the community desk is only unit-tested. It runs live in t.me/babykalki since 20 Nov 2026; its full five-step checklist is still to verify.', 'Reading "to verify" as "broken". It means "not yet checked".', 'Quoting an old test count. Use the number on the guide page (269 for this edition).'],
  teach: ['Use this chapter to teach honest status language: tested locally, live, to verify, preview.', 'Ask learners to sort five claims into the four status words, then check against this chapter.'],
  terms: ['Dry run', 'To verify', 'Preview', 'SHA-256', 'Path B'],
  quiz: [
    { q: 'How many automated tests pass in this edition\'s files?', o: ['109', '190', '269', '500'], a: 2, why: '269, run from the zip itself (v0.5 had 190, v0.4 118, v0.3 109).' },
    { q: 'What is the status of the Telegram community desk?', o: ['Not written yet', 'Running live in t.me/babykalki since 20 Nov 2026; its full five-step checklist still to verify', 'Only described on paper', 'Removed'], a: 1, why: 'Check (1) — Community desk: ON, an escalation reached the Steward — passed live; the rest are covered by automated tests.' },
    { q: 'What serves bk.openkalki.org?', o: ['A paid hosting service', 'The founder\'s own BabyKalki on Nimbuz (bk_static.py --www), since 20 Nov 2026', 'GitHub Pages', 'Nobody'], a: 1, why: 'v0.6 added the public website; the guide and this encyclopedia are published that way.' },
    { q: 'Which two holes did the founder\'s live test on 19 Nov find?', o: ['A slow website and a typo', 'Any session could commit through the Librarian\'s connector, and any session could record an approval', 'The Warden spoke the wrong language', 'None'], a: 1, why: 'Both closed in v0.5: the Librarian round and /bk-approve.' },
    { q: 'Which of these is still NOT verified?', o: ['The naming ceremony', 'The Approve click on /bk-approve in a live browser', 'Backup → restart → restore', 'The public website'], a: 1, why: 'It needs the founder\'s email code; the naming ceremony passed live on 19 Nov.' },
    { q: 'How was the private dashboard (v0.7) checked?', o: ['Not at all', 'Locally on real dsh 0.2.2-rc.3 with a headless browser, plus a start-up config check on the live instance; the live look is to verify', 'Only by reading the code', 'By the community bot'], a: 1, why: 'Panel ON, seven slash commands, GLM-only models and the DeepSeek account settings off were confirmed live at start-up.' },
    { q: 'What stood in for R2 in the Nimbuz dry run?', o: ['Google Drive', 'A MinIO bucket', 'GitHub', 'Nothing'], a: 1, why: 'MinIO stood in; real R2 (which needs a payment card) is still to verify.' },
    { q: 'After the 22 Nov 2026 test, what was still to verify on Path B?', o: ['Whether it starts at all', 'The hourly snapshot, a restore from a snapshot, and how existing installs get updated', 'The founder password', 'The naming ceremony'], a: 1, why: 'The install, the password, approvals, the naming ceremony and restarts all passed; those three were not checked.' },
    { q: 'What does "to verify" mean in the guide?', o: ['Broken', 'Not yet checked', 'Forbidden', 'Paid only'], a: 1, why: 'Items marked to verify are not yet checked.' },
    { q: 'What licence covers the code and prompts?', o: ['GPL', 'MIT', 'Proprietary', 'CC BY-NC'], a: 1, why: 'Code, configs and prompts: MIT. Text: CC BY 4.0. Data: CC0.' }
  ]
});

OK.chapters.push({
  id: 'teach', n: 19, title: 'Teaching BabyKalki', level: 'Teach', mins: 6,
  breath: 'Teach the office before the technology: six helpers, seven rules, one memory, one front door, and you hold the key — then show one "done when" check.',
  body: `
<h3>The 60-second pitch</h3>
<div class="callout gold">"BabyKalki is six AI helpers on a small cloud server — a front desk, a librarian, a reviewer, a steward, a builder and a scout. They keep a diary of everything and a library of checked facts, work in your GitHub, Gmail and Telegram, and ask before they act. There are two ways to get them: build it yourself with Claude Code — the first three levels in a day — or one-click on Nimbuz in about five minutes. It's free and open; you pay only for your own services, about \$30 to \$94 a month."</div>
<h3>A 60-minute workshop</h3>
<ol class="steps">
<li><b>0–10 min:</b> The office analogy and the six citizens (chapters 1, 6).</li>
<li><b>10–20 min:</b> The two paths, then the map — draw laptop, container, Cloudflare for Path A, and Path B's shorter map (chapters 1, 3, 9).</li>
<li><b>20–30 min:</b> The seven rules, sorted into enforced vs advisory (chapters 4, 15).</li>
<li><b>30–40 min:</b> Memory: act out FOUND / MISS / SUPERSEDED / RETIRED / REFUSED (chapter 7).</li>
<li><b>40–50 min:</b> Pick a use case; name its approval gates and its Register entries (chapters 11, 12).</li>
<li><b>50–60 min:</b> Costs and honest status; questions; show the QR code to the community (chapters 13, 18, 14).</li>
</ol>
<h3>Misconceptions to clear up</h3>
<ul>
<li>"It's a chatbot." → It's six citizens with jobs.</li>
<li>"You need Claude Code." → Only for Path A. Path B — One-click on Nimbuz is one form, no code.</li>
<li>"Path B is the same as Path A, just quicker." → Same citizens, Library, approvals and dashboard; but its backups stay on the same disk, and it has no status page, no Telegram desk and no own domain yet. Path B to try; Path A for the real memory.</li>
<li>"It acts on its own." → It drafts; you approve.</li>
<li>"It's fully tested." → L0–L2 tested locally, L3 passed an automated dry run and runs live for the founder (the live Approve click, schedules and real R2 still to verify), L4–L5 preview, the L6 desk live in t.me/babykalki with its full checklist still to verify.</li>
<li>"The preset menu (or the panel) walls the citizens off." → It is a convenience; only commits, approvals and telemetry are enforced.</li>
<li>"There's a GitHub repo I can send a PR to." → Not yet; fixes go to an admin as a zip with a note (chapter 14).</li>
<li>"My laptop must stay on." → The laptop builds; Nimbuz runs.</li>
<li>"Citizens are walled off." → One process; separation by role and token.</li>
</ul>
<h3>Teacher checklist</h3>
<ul class="check" id="teachcheck">
<li data-k="t1">I have read all 19 chapters</li>
<li data-k="t2">I can draw the map from memory</li>
<li data-k="t3">I can name the six citizens and their jobs</li>
<li data-k="t4">I can recite the seven rules</li>
<li data-k="t5">I can say which promises are enforced and which are advisory</li>
<li data-k="t6">I passed the Teacher exam with 80% or more</li>
<li data-k="t7">I have given the 60-second pitch to someone new</li>
<li data-k="t8">I can explain Path A and Path B, and when to pick each</li>
</ul>`,
  analogy: 'Teach like a tour of a small office: the people first, then the rules on the wall, then the filing cabinet and the front door.',
  mistakes: ['Starting with Docker, dsh and tunnels — it loses founders. Start with the six helpers.', 'Overselling the status. Say plainly what is tested and what is a preview.'],
  teach: ['Run the 60-minute workshop exactly once before improvising.', 'Keep the honesty table on screen while answering safety questions.'],
  terms: ['Teacher', 'Citizen', 'Rulebook', 'Path A', 'Path B'],
  quiz: [
    { q: 'What should you teach first?', o: ['Docker and tunnels', 'The six helpers and the office analogy', 'Pricing', 'The schema'], a: 1, why: 'People before technology.' },
    { q: 'Which is an accurate status statement?', o: ['"Fully tested in production"', '"L0–L2 tested locally; L3 passed a Nimbuz dry run and runs live, a few items still to verify; L4–L5 preview; the L6 desk runs live, its checklist still to verify"', '"Untested"', '"Only works on Windows"'], a: 1, why: 'That is what the guide says (chapter 18).' },
    { q: 'A founder wants to show BabyKalki to a co-founder tomorrow. What do you suggest?', o: ['Path A, all six levels tonight', 'Path B — One-click on Nimbuz: one form, running in about a minute', 'Wait for v2', 'Install it on a phone'], a: 1, why: 'Path B is for trying it and demos; Path A is for the company\'s real memory. They can move to A later (a migration guide is coming).' },
    { q: 'What does the pitch say you pay for?', o: ['A BabyKalki licence', 'Only your own services', 'A per-citizen fee', 'Nothing at all'], a: 1, why: 'Guide and files are free; you pay your own providers.' }
  ]
});

/* Interactive map data (keys = data-inst in OK.dia.map) */
OK.inst = {
  laptop: { name: 'Your laptop', kind: 'Build', does: 'Path A only: runs Claude Code, which writes, deploys, checks and fixes everything from missions you paste. It only builds — nothing important lives only here. Path B has no laptop part.', where: 'Your machine (macOS, Linux or Windows)', status: 'L0–L1 tested locally; the L2 image passed on Nimbuz — L2 on a laptop not yet run end to end', ch: 'levels' },
  zai: { name: 'Z.ai GLM Coding Plan', kind: 'The brain', does: 'GLM-5.3 and GLM-5.3-Flash for Claude Code; GLM-5.3 for all six citizens (selected by the agent-default-model row). One personal plan with a 5-hour and a weekly limit, shared by everything that uses your key.', where: 'Z.ai\'s cloud', status: 'Six citizens thought on GLM-5.3 in the 19 Nov dry run', ch: 'tools' },
  supervisor: { name: 'bk_supervisor', kind: 'Inside the container', does: 'Starts everything, health page first; watches the STOP switch every 5 s; runs infra as a separate user; forces dsh telemetry off; runs the Librarian round (user bklib) and, if you turn it on, the Telegram community desk (user bkcomm); writes the dashboard panel and slash commands (v0.7); redacts and rotates logs; restarts with backoff.', where: 'Nimbuz container', status: 'Tested locally + dry run; runs the founder\'s live instance (Librarian round, presets, telemetry off, website, community desk live since 20 Nov 2026)', ch: 'dashboards' },
  dsh: { name: 'dsh (DeepSeek Harness)', kind: 'Inside the container', does: 'Open-source (MIT) agent harness: sessions, tools, sub-agents, schedules, web UI — with the BabyKalki panel on top (v0.7). Listens on 127.0.0.1:3080 only. A developer preview.', where: 'Nimbuz container', status: 'dsh 0.2.2-rc.3 thinking in the dry run; presets + telemetry off (v0.5); panel and GLM-only picker checked locally (v0.7); live look and first scheduled delivery to verify', ch: 'tools' },
  'c-warden': { name: 'Warden', kind: 'Citizen — front desk', does: 'Talks to you, turns requests into tasks, delegates, collects approvals, sends the 08:00 briefing. Reads your mail, so gets no web tools.', where: 'dsh · GLM-5.3', status: 'Founding', ch: 'citizens' },
  'c-librarian': { name: 'Librarian', kind: 'Citizen — civic office (memory)', does: 'The only citizen who commits facts — since v0.5 only in the background Librarian round (user bklib, every 10 min or when the Warden asks). Supersedes and retires, never deletes. Writes self cards and the nightly human mirror.', where: 'dsh · GLM-5.3', status: 'Founding', ch: 'memory' },
  'c-reviewer': { name: 'Reviewer', kind: 'Citizen — civic office (checks)', does: 'Grades claims VERIFIED / CLAIMED / CONTRADICTED; reviews every PR with test output; checks drafts for facts, rights and labels.', where: 'dsh · GLM-5.3', status: 'Founding', ch: 'citizens' },
  'c-steward': { name: 'Steward', kind: 'Citizen — civic office (treasury & safety)', does: 'Watches budget, keeps the Connections Register (/connections) and approvals register, runs the monthly off-switch drill, receives community-desk escalations as tasks.', where: 'dsh · GLM-5.3', status: 'Founding', ch: 'connections' },
  'c-builder': { name: 'Builder', kind: 'Citizen — builders\' guild', does: 'Code on branches and PRs with tests; scripts, captions and prompts in the content studio. Never merges.', where: 'dsh · GLM-5.3', status: 'Founding', ch: 'usecases' },
  'c-scout': { name: 'Scout', kind: 'Citizen — research guild', does: 'Web research with a source and date for every claim: competitor scans, investor lists, "red-team my deck".', where: 'dsh · GLM-5.3', status: 'Founding', ch: 'usecases' },
  library: { name: 'Library service', kind: 'Inside the container', does: 'The only writer to memory (LadybugDB). Offers recall, propose_fact, tasks, connections and approvals over MCP; each citizen calls with its own token.', where: 'Nimbuz container, 127.0.0.1:7801', status: 'Tested locally; v0.5 on Nimbuz: commits only in the Librarian round, every other token refused', ch: 'memory' },
  tunnel: { name: 'cloudflared · bk_static', kind: 'Inside the container', does: 'cloudflared dials out to Cloudflare (no open ports). bk_static serves your website (v0.6), the public status page and /health on 8080 — no listing, no symlinks, no dotfiles, own-files-only CSP.', where: 'Nimbuz container', status: 'Named tunnel passed in the dry run', ch: 'cloud' },
  data: { name: '/data', kind: 'Storage', does: 'Library, diary, self cards, site and backups. Path A: wiped by every Nimbuz restart — restored from the newest COMPLETE snapshot in R2 before any citizen starts. Path B: kept on the tool\'s own 10 GB volume, with its snapshots on that same volume.', where: 'Nimbuz container (disposable on Path A; a kept volume on Path B)', status: 'Restore passed in the dry run (MinIO for R2)', ch: 'cloud' },
  cloudflare: { name: 'Cloudflare', kind: 'The front door (Path A)', does: 'Domain, outbound Tunnel, Zero Trust Access login gate and R2 backup storage — all on the free tier. Path A only: Path B uses Nimbuz\'s own address and a founder password instead.', where: 'Cloudflare', status: 'Named tunnel + Access passed in the dry run; real R2 to verify (needs a card)', ch: 'cloud' },
  www: { name: 'www.yourdomain', kind: 'Public (Path A only)', does: 'Your own website, if you want one (v0.6), and the public status page at /status/: a fixed template with counts and states only — the one exception to "you approve everything that leaves".', where: 'Via tunnel → bk_static :8080', status: 'Status page passed in the dry run; bk.openkalki.org is served this way live since 20 Nov 2026', ch: 'dashboards' },
  agent: { name: 'agent.yourdomain', kind: 'Private', does: 'Your private dashboard — the dsh web UI with the BabyKalki panel, one workspace per citizen and seven slash commands (v0.7) — behind two locks: Cloudflare Access and the dsh login cookie (30 days, survives restarts). /bk-login shows your login link once; /bk-approve (v0.5) is where only you approve. Another name? Set BK_AGENT_HOST. On Path B the same dashboard is at your Nimbuz address, behind the founder password + the dsh login.', where: 'Via tunnel → dsh :3080 (+ :8081 for /bk-login and /bk-approve)', status: 'Both locks passed in the dry run; /bk-login passed live; panel checked locally; live look and Approve click to verify', ch: 'cloud' },
  hooks: { name: 'hooks.yourdomain', kind: 'Planned', does: 'A public route for a WhatsApp webhook. It must bypass Access, so every request is checked against Meta\'s signature. The bridge is not in the files yet.', where: 'Via tunnel (planned)', status: 'Planned — not in the files yet', ch: 'connections' },
  you: { name: 'You', kind: 'The sponsor', does: 'Sponsor of all six citizens. You approve anything that leaves: an email sent, a PR merged, a post published, money moved. Only you can restart after a stop.', where: 'Phone or browser', status: 'Always', ch: 'rulebook' }
};
