/* BabyKalki Encyclopedia — chapters 1–9. Plain English. Source: BabyKalki guide v1.3.1 (22 Nov 2026). */
window.OK = window.OK || {}; OK.chapters = OK.chapters || [];

OK.chapters.push({
  id: 'what', n: 1, title: 'What is BabyKalki?', level: 'Start here', mins: 5,
  breath: 'BabyKalki is six AI citizens on a small cloud server that keep a diary of everything and a library of checked facts, work inside the services you already use, and ask you before they act. There are two ways to get them: Path A — Build it yourself with Claude Code, or Path B — One-click on Nimbuz.',
  body: `
<p>Most "AI agents" are one chatbot with some tools. <b>BabyKalki is a small society instead</b>: six AI helpers — called <b>citizens</b> — each with a different job, sharing one rulebook and one memory. You are their sponsor and their boss.</p>
<p>It is a free, founder-sized guide by Robin Dey, and there are <b>two equal ways</b> to get your own BabyKalki:</p>
<ul>
<li><b>Path A — Build it yourself with Claude Code.</b> On your own laptop you <b>talk to Claude Code</b>, running on your own Z.ai GLM Coding Plan: you paste a "mission", Claude Code checks the guide's zip, writes and runs the code and deploys it to a Nimbuz application, and you read what it shows you and approve. L0–L2 take about a day on the laptop; going always-on (L3) about 2–3 hours more.</li>
<li><b>Path B — One-click on Nimbuz.</b> In Nimbuz you open Tools → New Tool → Babykalki, fill in one form and press Submit; about a minute later your citizens are running on a Nimbuz web address, behind a founder password. No Claude Code, no domain, no Cloudflare, no zip.</li>
</ul>
<div class="callout"><b>The one-line version:</b> on Path A you describe it and Claude Code builds and deploys it; on Path B you fill in one form on Nimbuz — either way, your citizens run it.</div>
{{dia:paths}}
<p>Both paths give you the same six citizens, the same Library and diary, the same approvals page and the same private dashboard. They differ in who builds it, where your backups live and what sits around it: Path A adds your own domain, two sign-in locks with an email code, off-site backups with a restore drill, a public status page and website, the Telegram community desk and connectors (L4, preview). <b>Our advice:</b> Path B to try it — a demo, your first weeks; Path A for your company's real memory. You can start on B and move to A later — a migration guide is coming. Side by side: <a href="#/c/cloud">chapter 9</a>.</p>
<h3>What you end up with</h3>
<div class="grid4">
<div class="card"><b>Six citizens</b><p>A front desk, a librarian, a reviewer, a steward, a builder and a scout — named by you.</p></div>
<div class="card"><b>A real memory</b><p>An automatic diary of every event, and a Library of facts that are corrected, never erased.</p></div>
<div class="card"><b>Always on</b><p>One container running 24×7 on a low-cost Indian cloud (Nimbuz) — backed up off-site to your own Cloudflare storage on Path A, or to the tool's own disk on Path B.</p></div>
<div class="card"><b>You hold the key</b><p>Emails stay drafts, code stays a pull request, posts wait — until you say "approve".</p></div>
</div>
<h3>The shape of it</h3>
<ul>
<li><b>A front desk.</b> Only one citizen — the <b>Warden</b> — talks to you. It routes work, chases it, and asks for your approval.</li>
<li><b>Three civic offices.</b> The <b>Librarian</b> (memory), the <b>Reviewer</b> (checks every claim) and the <b>Steward</b> (money, keys, safety, off-switch) serve everyone.</li>
<li><b>Guilds that do the work.</b> Start with a <b>Builder</b> (code, content) and a <b>Scout</b> (research). Add Growth or Ops citizens later — a guild stays small.</li>
<li><b>It connects — it doesn't self-host.</b> It works inside GitHub, Gmail, Calendar, Drive, Telegram (WhatsApp later) and Cloudflare. No servers of your own to babysit.</li>
</ul>
<h3>What it is not</h3>
<ul>
<li><b>Not a product you buy.</b> It is an open guide plus one checked zip of files (Path A) — and, on Path B, a one-click tool that the Nimbuz team added to Nimbuz's catalogue. You pay only for your own services.</li>
<li><b>Not OpenKalki.</b> It is OpenKalki's small sibling — it borrows the ideas, not the datacentre.</li>
<li><b>Not finished everywhere — and it says so.</b> This is <span class="tag build">BabyKalki v1.3.1</span>: L0–L2 tested locally (L2 on a laptop not yet run end to end), L3 followed end to end on Nimbuz by an automated dry run and running live for the founder — his BabyKalki serves bk.openkalki.org and the Telegram community desk — while L4–L5 are still a preview. Path B was tested end to end on 22 Nov 2026, with clear limits. Chapter 18 says exactly what is verified.</li>
<li><b>Not a closed club.</b> There is a community on Telegram (<a href="https://t.me/babykalki" rel="noopener">t.me/babykalki</a>) where a desk bot answers from the guide and humans answer the rest — see <a href="#/c/community">Community and ecosystem</a>.</li>
</ul>`,
  analogy: 'Think of a tiny start-up office: a receptionist, a records clerk, a fact-checker, an office manager, an engineer and a researcher. You are the founder — they prepare everything, you sign.',
  mistakes: ['Thinking it is one chatbot. It is six citizens with separate jobs and shared rules.', 'Thinking agents act on their own. Anything that leaves the system needs your approval.', 'Thinking you must code. On Path A you paste missions and Claude Code types — but you must read and approve; on Path B there is no code at all, just one form.', 'Thinking Claude Code is required. Only Path A uses it; Path B — One-click on Nimbuz needs a browser, a Nimbuz account and your Z.ai key.'],
  teach: ['Open with the office analogy before any technology.', 'Ask: "What would you want a helper to NEVER do without asking you?" — then show the rulebook.', 'Close with "What it is not" — it clears most confusion.'],
  terms: ['Citizen', 'Warden', 'Mission', 'Claude Code', 'Civic office', 'Guild', 'Path A', 'Path B'],
  quiz: [
    { q: 'What is the best short description of BabyKalki?', o: ['One chatbot with tools', 'Six AI citizens with different jobs, shared rules and a shared memory', 'A paid SaaS product', 'A new AI model'], a: 1, why: 'It is a small society: six citizens, one rulebook, one Library.' },
    { q: 'On Path A, who writes the code?', o: ['You, by hand', 'Claude Code, from missions you paste', 'Nimbuz support', 'Nobody — it is pre-installed'], a: 1, why: 'You paste a mission; Claude Code writes and runs it; you read and approve. (Path B has no code to write: one form.)' },
    { q: 'Which citizen talks to you directly?', o: ['All six', 'The Scout', 'Only the Warden', 'The Librarian'], a: 2, why: 'One front desk: only the Warden talks to you.' },
    { q: 'On Path A, how long do levels L0–L2 take?', o: ['About an hour', 'About a day', 'About a month', 'They are not possible yet'], a: 1, why: 'L0–L2 in a day, on your laptop; L3 (always on) about 2–3 hours more. Path B runs about a minute after you submit its form.' },
    { q: 'What are the two ways to get BabyKalki?', o: ['A free and a paid version', 'Path A — Build it yourself with Claude Code, and Path B — One-click on Nimbuz', 'Windows and Mac', 'A laptop version and a phone app'], a: 1, why: 'Both give you the same six citizens, Library, approvals and private dashboard.' },
    { q: 'Which path does the guide advise for your company\'s real memory?', o: ['Path B, because it is quicker', 'Path A — off-site backups with a restore drill, your own domain, a status page', 'Neither', 'Whichever is cheaper'], a: 1, why: 'Path B is for trying it — a demo, your first weeks. You can start on B and move to A later (a migration guide is coming).' }
  ]
});

OK.chapters.push({
  id: 'why', n: 2, title: 'Where it comes from', level: 'Start here', mins: 4,
  breath: 'Robin Dey built more than a dozen agent systems; his first always-on one, "The Beast", taught the hard lessons; those became OpenKalki — and BabyKalki is its free, founder-sized version.',
  body: `
<p>BabyKalki was written by <b>Robin Dey</b>, who builds societies of AI agents. His one lesson from recent years: <b>stop treating AI as a chatbot, and start treating it as a workforce.</b></p>
<p>He has designed more than a dozen multi-agent systems — research teams analysing space-telescope data, agents that audit published AI research, agents researching history and genomics.</p>
{{dia:lineage}}
<h3>The Beast</h3>
<p>His first always-on system, nicknamed <b>"The Beast"</b>, ran day and night and reported to his phone. It taught every hard lesson: agents that forget, servers that fill up, costs that run away — and two copies of the same bot arguing with each other. (Each lesson, and the rule it produced, is in the chapter <a href="#/c/lessons">War stories</a>.)</p>
<h3>OpenKalki</h3>
<p>All of that became <b>OpenKalki</b>: a society of AI agents with a library for memory, reviewers that check every claim, and humans who approve anything that leaves the building.</p>
<h3>BabyKalki</h3>
<p>But you don't need a datacentre to start. BabyKalki takes OpenKalki's ideas — <b>citizens, civic offices, a library that never erases, human approval</b> — and fits them into one small container that connects to services you already use. Open, free to use, with credit.</p>
<div class="callout gold"><b>Launched at:</b> the Hyderabad Entrepreneurship Summit 2026 (TiE Hyderabad), as a founder's guide.</div>`,
  analogy: 'OpenKalki is the city; BabyKalki is a well-run village built on the same laws.',
  mistakes: ['Calling BabyKalki "OpenKalki lite software". It shares ideas, not code or servers.', 'Thinking the rules are theory. Every rule comes from something that went wrong in The Beast.'],
  teach: ['Tell one Beast story (two bots arguing works well) before showing any rule.', 'Draw the three-box family tree: Beast → OpenKalki → BabyKalki.'],
  terms: ['The Beast', 'OpenKalki', 'Robin Dey'],
  quiz: [
    { q: 'What was "The Beast"?', o: ['A GPU cluster', 'Robin\'s first always-on agent system', 'A rival product', 'A citizen of BabyKalki'], a: 1, why: 'The Beast ran day and night and taught the hard lessons.' },
    { q: 'How is BabyKalki related to OpenKalki?', o: ['It is the same system', 'It is OpenKalki\'s small sibling, borrowing its ideas', 'It replaces OpenKalki', 'It has nothing to do with it'], a: 1, why: 'BabyKalki borrows citizens, offices, a library that never erases, and human approval.' },
    { q: 'Robin\'s core lesson is to treat AI as…', o: ['a search engine', 'a chatbot', 'a workforce', 'a toy'], a: 2, why: '"Stop treating AI as a chatbot, and start treating it as a workforce."' }
  ]
});

OK.chapters.push({
  id: 'map', n: 3, title: 'The map', level: 'Start here', mins: 6,
  breath: 'On Path A, one laptop builds it, one container runs it, and Cloudflare is the only front door. On Path B the map is shorter: one Nimbuz tool runs it, on a Nimbuz address, behind a founder password.',
  body: `
<p>This map is <b>Path A — Build it yourself with Claude Code</b>. It has three places. <b>Your laptop</b> is where you build. <b>One container on Nimbuz</b> is where the citizens live. <b>Cloudflare</b> is the only way in from the internet. Tap any box on the map to learn what it does. <b>Path B — One-click on Nimbuz</b> has a shorter map — see below.</p>
{{dia:map}}
<div id="instcard" class="instcard muted">Tap a box above.</div>
<h3>Inside the container</h3>
<ul>
<li><b>bk_supervisor</b> starts everything, watches the STOP switch, and runs the infrastructure (tunnel, backups, status page) as a <b>separate user</b> the citizens can't read.</li>
<li><b>dsh</b> (DeepSeek Harness) is the agent harness. It listens on <code>127.0.0.1:3080</code> only — never on every interface (0.0.0.0).</li>
<li><b>The Library service</b> is the only program that writes to memory (LadybugDB).</li>
<li><b>cloudflared</b> dials <i>out</i> to Cloudflare; <b>bk_static</b> serves the public status page and <code>/health</code> on port 8080.</li>
<li><b>/data</b> holds the library, diary, self cards, site and backups — and is copied off-site to Cloudflare R2.</li>
</ul>
<h3>Three web addresses</h3>
<table class="tbl">
<tr><th>Name</th><th>What it is</th><th>Who can see it</th></tr>
<tr><td><code>www.yourdomain</code></td><td>Public status page — fixed template, counts only; with your own website (v0.6) the site is at <code>/</code> and the status page at <code>/status/</code></td><td>Anyone</td></tr>
<tr><td><code>agent.yourdomain</code></td><td>Private dashboard (dsh with the BabyKalki panel) + <code>/bk-login</code> and the founder-only <code>/bk-approve</code></td><td>Only you — two locks</td></tr>
<tr><td><code>hooks.yourdomain</code></td><td>Planned public route for a WhatsApp webhook, checked by Meta's signature</td><td><span class="tag plan">planned — not in the files yet</span></td></tr>
</table>
<div class="callout"><b>Key idea (Path A):</b> nothing on the server listens to the internet for the agents. cloudflared dials out to Cloudflare; Cloudflare checks who you are before anything reaches dsh.</div>
<h3>Path B's shorter map</h3>
<p>On <b>Path B — One-click on Nimbuz</b> there is no laptop part, no Cloudflare and no zip. There are two places: <b>Nimbuz</b>, where one BabyKalki tool runs the same container inside, and <b>you</b>, in a browser.</p>
<ol class="steps">
<li><b>You</b> open your Nimbuz address: <code>https://&lt;name&gt;-babykalki-&lt;env&gt;.ap-south-1a.lb.nimbuz.tech</code>. Nimbuz's own HTTPS front door holds a valid certificate; <code>http://</code> is redirected to <code>https://</code>.</li>
<li><b>Lock 1 — the founder password</b> (the username and password you set in the form; the browser asks) stands in front of <code>/bk-login</code> and <code>/bk-approve</code>.</li>
<li><b>Lock 2 — dsh's own login</b> guards everything else: the private dashboard, its API and websocket.</li>
<li><b>Inside:</b> the same kit — the supervisor, dsh, the six citizens, the Library and the Librarian round.</li>
<li><b>/data</b> sits on the tool's own persistent volume (10 GB, kept across restarts), and the snapshots sit <b>on that same volume</b> — there is no R2.</li>
</ol>
<p>There is no <code>www.</code> and no <code>hooks.</code> on Path B: one Nimbuz address only, no public website and no status page yet (tested 22 Nov 2026).</p>`,
  analogy: 'A workshop (laptop) builds a sealed shop (container); the shop has no street door — only a guarded tunnel to a reception building (Cloudflare) with three counters.',
  mistakes: ['Thinking the laptop must stay on. It only builds; the container runs 24×7.', 'Thinking dsh is open to the internet. It binds 127.0.0.1; only the tunnel reaches it.', 'Thinking hooks. exists today. It is planned for WhatsApp, not in the files yet.', 'Looking for the status page at www.yourdomain/ when you have your own website. It moves to /status/.', 'Looking for www., a tunnel or R2 on Path B. It has one Nimbuz address, a founder password and dsh\'s login — and its snapshots stay on its own volume.'],
  teach: ['Have learners draw the three places from memory: laptop, container, Cloudflare (Path A).', 'Then draw Path B next to it: you → Nimbuz address → founder password → dsh login → the same container.', 'Ask: "Which way does the tunnel dial?" (Outwards.)'],
  terms: ['Container', 'dsh', 'bk_supervisor', 'Tunnel', 'Status page', 'R2', 'Path A', 'Path B', 'Founder password'],
  quiz: [
    { q: 'Where do the six citizens run day to day?', o: ['On your laptop', 'In one container on Nimbuz', 'Inside Cloudflare', 'On Z.ai\'s servers'], a: 1, why: 'The laptop builds; one Nimbuz container runs it 24×7.' },
    { q: 'On Path A, which address shows the private dashboard?', o: ['www.yourdomain', 'agent.yourdomain', 'hooks.yourdomain', 'localhost only'], a: 1, why: 'agent.yourdomain, behind Cloudflare Access plus the dsh login. On Path B it is your Nimbuz address.' },
    { q: 'Which way does the Cloudflare tunnel connect?', o: ['Inbound, through an open port', 'Outbound — cloudflared dials out', 'Over email', 'Through the laptop'], a: 1, why: 'No open ports: cloudflared dials out, so nothing listens to the internet.' },
    { q: 'What address does dsh listen on?', o: ['0.0.0.0', '127.0.0.1', 'A public IP', 'hooks.yourdomain'], a: 1, why: 'dsh stays on 127.0.0.1:3080; it refuses to bind 0.0.0.0 by design.' },
    { q: 'On Path B, what stands in front of /bk-login and /bk-approve?', o: ['Cloudflare Access', 'The founder username and password you set in the form', 'Nothing', 'A Telegram code'], a: 1, why: 'The browser asks for them; everything else needs dsh\'s own login. Tested 22 Nov 2026.' }
  ]
});

OK.chapters.push({
  id: 'rulebook', n: 4, title: 'The seven-line rulebook', level: 'Core', mins: 5,
  breath: 'Seven short rules every citizen reads: you approve anything that leaves, every claim says how we know, facts are corrected not erased, no secrets, a miss says MISS, every task has an owner and a date, and the off-switch is tested monthly.',
  body: `
<p>All six citizens load the same shared rulebook (<code>AGENTS.md</code>) at the start of every session. It is seven lines long on purpose — short enough to remember, strict enough to matter.</p>
<ol class="steps">
<li><b>You approve anything that leaves the system:</b> an email sent, a PR merged, a post published, money moved.</li>
<li><b>Every claim says how we know it.</b> The Reviewer can re-check anything.</li>
<li><b>Facts are corrected, never erased.</b></li>
<li><b>No secrets in memory, chat or repo.</b></li>
<li><b>A lookup that finds nothing says MISS.</b></li>
<li><b>Every task has an owner and a date.</b></li>
<li><b>The off-switch is tested monthly.</b></li>
</ol>
<h3>The one exception to rule 1</h3>
<p>The <b>public status page</b> is published automatically — but only from a <b>fixed template</b> that contains counts and states, never free text, never anything a citizen wrote. Citizens cannot even write to the public folder: it belongs to a separate user. Anything else public needs your approval. (The status page is a Path A feature; Path B has none yet.)</p>
<h3>Rules vs locks</h3>
<p>A rule in a prompt is not a lock. BabyKalki is honest about which rules are <b>enforced by code</b> (for example "a miss says MISS", "no delete tool") and which are <b>advisory</b> — prompt rules only (for example "use only your own Library connector"). The full table is in <a href="#/c/safety">Safety: enforced vs advisory</a>.</p>`,
  analogy: 'Like the seven rules painted on a workshop wall — and a separate list of which machines actually have guards fitted.',
  mistakes: ['Assuming every rule is enforced by code. Some are prompt rules only — the guide labels them.', 'Thinking the status page breaks rule 1 silently. It is the one stated exception, and template-only.'],
  teach: ['Have the group recite the seven rules, then sort them into "enforced" and "advisory" piles.', 'Ask why "a miss says MISS" matters: a silent empty answer looks like "no such thing".'],
  terms: ['Rulebook', 'MISS', 'Approval', 'Status page', 'Advisory'],
  quiz: [
    { q: 'Which of these may a citizen do without your approval?', o: ['Send an email', 'Merge a PR', 'Update the template-only status page', 'Move money'], a: 2, why: 'The status page is the one exception — fixed template, counts only.' },
    { q: 'What must a lookup that finds nothing say?', o: ['Nothing', '"Not found, sorry"', 'MISS', 'A best guess'], a: 2, why: 'Rule 5: a lookup that finds nothing says MISS (with coverage).' },
    { q: 'How are wrong facts handled?', o: ['Deleted', 'Corrected by a newer fact — never erased', 'Hidden', 'Left as they are'], a: 1, why: 'Rule 3: facts are corrected, never erased.' },
    { q: 'How often is the off-switch tested?', o: ['Never', 'Yearly', 'Monthly', 'Hourly'], a: 2, why: 'Rule 7: monthly — on the 1st of every month.' }
  ]
});

OK.chapters.push({
  id: 'tools', n: 5, title: 'The toolkit', level: 'Core', mins: 6,
  breath: 'Six pieces: Claude Code builds (Path A only), the Z.ai GLM Coding Plan thinks, dsh hosts the citizens, Nimbuz runs the container, LadybugDB holds the Library, and Cloudflare is the front door and backup store (Path A only). Path B needs just Nimbuz and your Z.ai key.',
  body: `
<table class="tbl">
<tr><th>Piece</th><th>What it does</th><th>Where it runs</th></tr>
<tr><td><b>Claude Code</b> — <i>Path A only</i></td><td>Your builder. You describe; it writes the files, deploys, checks and fixes. Path B needs no Claude Code.</td><td>Your laptop</td></tr>
<tr><td><b>Z.ai GLM Coding Plan</b></td><td>The brain for your citizens on both paths (all six on GLM-5.3), and for Claude Code on Path A (GLM-5.3, GLM-5.3-Flash). Your own subscription.</td><td>Z.ai's cloud</td></tr>
<tr><td><b>DeepSeek Harness (dsh)</b></td><td>Open-source (MIT) agent harness: sessions, tools, sub-agents, schedules, web UI. Your citizens live here. A developer preview.</td><td>Nimbuz</td></tr>
<tr><td><b>Nimbuz</b></td><td>Low-cost Indian cloud platform that runs your one container — as an app you deploy from the zip (Path A), or as its one-click BabyKalki tool (Path B).</td><td>nimbuz.tech</td></tr>
<tr><td><b>LadybugDB</b></td><td>Embedded graph database (MIT) — one file that holds the Library.</td><td>Inside the container</td></tr>
<tr><td><b>Cloudflare</b> — <i>Path A only</i></td><td>Your domain, a tunnel (no open ports), a login gate for the private dashboard, and R2 storage for backups. Free tier. Path B uses Nimbuz's own address and a founder password instead.</td><td>Cloudflare</td></tr>
</table>
<p><b>Which pieces on which path?</b> <b>Path A — Build it yourself with Claude Code</b> uses all six. <b>Path B — One-click on Nimbuz</b> uses four — your Z.ai plan, dsh, Nimbuz and LadybugDB, all inside Nimbuz's tool — with no Claude Code and no Cloudflare.</p>
<h3>One plan, shared by everyone</h3>
<p>The Z.ai plan has a <b>5-hour</b> and a <b>weekly</b> credit limit, shared by everything that uses your key — your laptop (on Path A) <i>and</i> all six citizens. That is why the guide recommends sparse schedules on Lite, and Pro for six always-on citizens.</p>
<p>On Path A, Claude Code is pointed at Z.ai through its settings: base URL <code>https://api.z.ai/api/anthropic</code>, with <code>glm-5.3</code> for the big models and <code>glm-5.3-flash</code> for the small one. Without a <code>[1m]</code> suffix you get the default 200k context.</p>
<p>Inside the container, dsh reaches Z.ai through one route called <code>zai-coding</code> in <code>cordis.patch.yml</code> — <b>plus a default-model row</b> (<code>agent-default-model: zai-coding / glm-5.3</code>) that tells dsh to use it. v0.3 forgot that row, so dsh kept its DeepSeek default and no citizen could think; the dry run found it, v0.4 fixed it, and the L2 mission checks it.</p>
<h3>Nothing goes back to DeepSeek (v0.5)</h3>
<p>dsh is made by DeepSeek, and out of the box it can send data home even when your citizens think on GLM. Tested on dsh 0.2.2-rc.3 with every outgoing connection logged: with v0.4's settings, clicking 👍/👎 or <i>More → Feedback → Submit</i> <b>uploaded the conversation log</b> to DeepSeek's telemetry collector. v0.5 locks it three ways:</p>
<ul>
<li>the image sets <code>DSH_TELEMETRY_MODE=DISABLED</code> and a dead telemetry address (<code>DSH_TELEMETRY_OTLP_URL=http://127.0.0.1:9/</code>);</li>
<li>the supervisor forces them again in dsh's environment, whatever your Nimbuz settings say (unless you set <code>BK_ALLOW_TELEMETRY=1</code>);</li>
<li><b>eight rows</b> in section 0 of <code>cordis.patch.yml</code> switch off session telemetry, the "Upload Session Log" setting, plugin inventory, DeepSeek account sign-in (×2), DeepSeek web search and product analytics (×2).</li>
</ul>
<p>With those, the same feedback click reached Z.ai only. <b>Since v0.7 the dashboard removes those parts altogether:</b> 👍/👎 and the Feedback menu, "Sign in" and the DeepSeek account settings, the "Upload Session Log" setting, the Plugins page and DeepSeek's models (see <a href="#/c/dashboards">Dashboards</a>) — never sign in with a DeepSeek account. <b>Your check:</b> the status page says <i>Telemetry to DeepSeek (dsh): OFF</i>, and the model picker shows only GLM. Still sent, on purpose: one short call per new session to Z.ai for its title. (Path B has no status page yet, so you can't see that line there; the same kit settings are inside.)</p>
<h3>Rules of the plan</h3>
<p>The GLM Coding Plan is a <b>personal</b> subscription: one person, no account sharing, and only in supported agent tools. It covers your own work. A bot that answers <i>your customers</i> needs a separate pay-per-use key.</p>
<h3>Not locked in</h3>
<ul>
<li>dsh speaks the OpenAI and Anthropic protocols — you can switch model providers by changing the route (and the default-model row) in <code>cordis.patch.yml</code>.</li>
<li>The container is standard Docker: it runs on any Docker host, not only Nimbuz.</li>
<li>If LadybugDB ever lets you down, the same Library design works on SQLite (WAL mode + full-text search).</li>
</ul>`,
  analogy: 'A builder (Claude Code), an engine (GLM), a building (dsh in a Nimbuz container), a filing cabinet (LadybugDB) and a gatehouse with a safe-deposit box (Cloudflare).',
  mistakes: ['Thinking your laptop and citizens have separate quotas. They share one plan\'s limits.', 'Declaring a model route but no default model. dsh then keeps its DeepSeek default — check that agent-default-model says zai-coding / glm-5.3.', 'Using the Coding Plan for a customer-facing bot. That needs a separate pay-per-use key.', 'Thinking you are stuck with Nimbuz. It is plain Docker.', 'Thinking a GLM-only setup sends nothing to DeepSeek. dsh\'s feedback button did, until v0.5 switched telemetry off.', 'Thinking you need Claude Code or Cloudflare to run BabyKalki. Only Path A uses them; on Path B Nimbuz starts BabyKalki from one form.'],
  teach: ['Hand out six cards (one per tool) and have learners place them on the map.', 'Ask: "What happens to the citizens if you use Claude Code all night?" (Shared quota.)'],
  terms: ['Claude Code', 'Z.ai GLM Coding Plan', 'dsh', 'Nimbuz', 'LadybugDB', 'Cloudflare', 'Default model', 'Telemetry', 'Path A', 'Path B'],
  quiz: [
    { q: 'What is dsh?', o: ['A database', 'The open-source agent harness where the citizens live', 'A Cloudflare product', 'A model'], a: 1, why: 'DeepSeek Harness: sessions, tools, sub-agents, schedules, web UI.' },
    { q: 'What holds the Library?', o: ['Google Drive', 'LadybugDB, one embedded file', 'GitHub', 'Telegram'], a: 1, why: 'LadybugDB is an embedded graph database — one file in the container.' },
    { q: 'Who shares the Z.ai plan\'s limits?', o: ['Only the Warden', 'Only your laptop', 'Your laptop and all six citizens', 'Nobody — it is unlimited'], a: 2, why: 'The 5-hour and weekly limits are shared by everything using your key.' },
    { q: 'A bot that answers your customers on WhatsApp should use…', o: ['Your Coding Plan', 'A separate pay-per-use model key with a cap', 'A friend\'s account', 'No model at all'], a: 1, why: 'The Coding Plan is personal-use; customer-facing work needs its own key.' },
    { q: 'In v0.3 no citizen could think. Why?', o: ['The Z.ai key was wrong', 'cordis.patch.yml declared the Z.ai models but never selected one, so dsh kept its DeepSeek default', 'Nimbuz blocks Z.ai', 'The Warden was asleep'], a: 1, why: 'v0.4 adds the row agent-default-model: zai-coding / glm-5.3, and the L2 mission checks it.' },
    { q: 'In v0.4, what happened when you clicked 👍/👎 and Submit in the dsh web UI?', o: ['Nothing', 'The conversation log was uploaded to DeepSeek\'s telemetry collector', 'It went to the Library', 'It emailed you'], a: 1, why: 'Found by an egress test on dsh 0.2.2-rc.3. v0.5 switches telemetry off (env + eight config rows); the click then reaches Z.ai only.' },
    { q: 'Which pieces does Path B — One-click on Nimbuz not use?', o: ['dsh and the Library', 'Claude Code and Cloudflare', 'Your Z.ai plan', 'Nimbuz'], a: 1, why: 'Path B needs a Nimbuz account and your Z.ai key — no Claude Code, no domain, no Cloudflare, no zip.' },
    { q: 'How do you check that nothing goes to DeepSeek?', o: ['Ask the Scout', 'The status page says "Telemetry to DeepSeek (dsh): OFF" (and since v0.7 the feedback, sign-in and upload settings are gone from the dashboard)', 'Sign in with a DeepSeek account', 'You can\'t'], a: 1, why: 'Env forced off + eight config rows since v0.5; v0.7 also hides the DeepSeek parts of the UI.' }
  ]
});

OK.chapters.push({
  id: 'citizens', n: 6, title: 'The six citizens', level: 'Core', mins: 7,
  breath: 'Warden (front desk), Librarian (memory), Reviewer (checks), Steward (money and safety), Builder (code and content) and Scout (research) — each a working folder with its own rules and Library token, picked from the dashboard\'s panel or mode menu, all on GLM-5.3, all sponsored by you.',
  body: `
<p>Each citizen is a <b>working folder</b> (<code>/data/citizens/&lt;name&gt;/</code>) with its own rules (<code>AGENTS.md</code>), its own self card and its own Library token — you open a dsh session for it. It is <i>not</i> a separate dsh agent: dsh calls every session "lead", and the role comes from the <b>preset</b> you pick (v0.5) — or, without presets, from the folder. All six run on <b>GLM-5.3</b>; choosing Flash per citizen is a later item. <b>You are the sponsor of all six.</b> Meet them in the <a href="#/citizens">citizen directory</a>.</p>
<table class="tbl">
<tr><th>Citizen</th><th>Job</th><th>Model</th></tr>
<tr><td>🛎️ <b>Warden</b> — front desk</td><td>Talks to you, turns requests into tasks, delegates, collects approvals, sends the 08:00 briefing. Reads your mail — and therefore gets no web tools.</td><td>GLM-5.3</td></tr>
<tr><td>📚 <b>Librarian</b> — memory</td><td>The only citizen who commits facts — since v0.5 only in the background <b>Librarian round</b>. Supersedes and retires, never deletes. Writes each citizen's self card and the nightly human mirror.</td><td>GLM-5.3</td></tr>
<tr><td>🔍 <b>Reviewer</b> — checks</td><td>Grades claims VERIFIED / CLAIMED / CONTRADICTED. Reviews every PR with test output. Checks every draft for facts, rights and labels.</td><td>GLM-5.3</td></tr>
<tr><td>⚖️ <b>Steward</b> — treasury &amp; safety</td><td>Watches budget, keeps the Connections Register and the approvals register, runs the monthly off-switch drill.</td><td>GLM-5.3</td></tr>
<tr><td>🛠️ <b>Builder</b> — builders' guild</td><td>Code on branches and pull requests with tests. In the content studio, writes scripts, captions and prompts. Never merges.</td><td>GLM-5.3</td></tr>
<tr><td>🧭 <b>Scout</b> — research guild</td><td>Web research with a source and date for every claim. Competitor scans, investor lists, "red-team my deck".</td><td>GLM-5.3</td></tr>
</table>
<h3>The naming ceremony</h3>
<p>On first start the Warden asks: <b>"Shall I name the six of us, or will you?"</b> If you say "you", it asks which languages you use and any names to avoid, then proposes two culturally fitting names and one-line personas for each role. You can rename anyone at any time — "rename Scout to Meera". <b>The role and the rules never change; only the name and voice do.</b> <span class="tag live">verified live, 19 Nov 2026</span> — the founder did it in a browser: a Library check, three questions, a choice of name slates, the approval recorded, six card proposals. Afterwards (v0.5) the Warden asks the Librarian round to commit the names — names are internal, so no approval is needed — and the panel, the mode menu and the citizen workspaces show the new names after the next restart.</p>
<h3>Picking a citizen: panel, home page, mode menu</h3>
<p>Since v0.7 the private dashboard has a <b>BabyKalki panel</b> with a card and a <b>New session with …</b> button per citizen, one <b>workspace</b> per citizen, and a home page that asks <i>"Who do you want to talk to?"</i>; the mode menu lists exactly your six citizens, the Warden ticked by default (details in <a href="#/c/dashboards">Dashboards</a>). Underneath, each choice is a <b>citizen preset</b>:</p>
<p>In v0.4 every web session started in the same folder, so a session only "knew" it was the Librarian from your first message (found live, 19 Nov). v0.5 adds <b>six agent presets</b>, one per citizen, to dsh's menu for a new session (<code>BK_CITIZEN_PRESETS=1</code>, the default). Each is dsh's own standard preset plus a persona ("You are the Scout … read your AGENTS.md and self card, work in your work/ folder") and <b>only that citizen's Library connector</b>. Display names come from the self cards ("Edith · Librarian").</p>
<ul>
<li>Checked offline against a real dsh 0.2.2-rc.3 with a stand-in model: the six presets register with no errors, a Scout session's tool list holds only <code>library-scout</code>, a plain standard session has no Library at all, and the web Librarian can list proposals but its commit is REFUSED. On Nimbuz the presets appear in dsh's composed config. The v0.7 panel and mode menu were then checked locally in a browser on real dsh 0.2.2-rc.3. <span class="tag plan">to verify</span>: the look on the live instance, and a real GLM turn in each citizen's session.</li>
<li><b>A convenience, not a lock.</b> The five other citizens' tokens still share one dsh process, so a session that tries hard can act as another of those five (e.g. the Scout adding a task as the Steward). That separation stays <span class="tag plan">ADVISORY</span>.</li>
<li>If presets misbehave: <code>BK_CITIZEN_PRESETS=shared</code> keeps the menu without per-citizen connectors (as v0.4), <code>0</code> removes it; if dsh fails to start twice with presets, the supervisor drops them for that run by itself (FALLBACK on the status page).</li>
</ul>
<h3>How six citizens live in one dsh</h3>
<ul>
<li><b>Rulebook:</b> <code>$DSH_HOME/AGENTS.md</code> is loaded for every session.</li>
<li><b>Each citizen:</b> its preset (v0.5) points the session at its folder; a session started in its <code>work/</code> subfolder picks up the parent folder's <code>AGENTS.md</code> (seen in the dry run); its <b>self card</b> is <code>AGENTS.local.md</code> in the same folder <span class="tag plan">to verify</span>.</li>
<li><b>The Librarian round (v0.5):</b> the Librarian's committing key is not in the web dsh at all — a separate headless dsh runs as its own Linux user (<code>bklib</code>) every 10 minutes and when the Warden asks. See <a href="#/c/memory">Memory</a>.</li>
<li><b>Delegation:</b> the Warden uses dsh sub-agents; repeatable jobs use dsh workflows; timed jobs use dsh's schedule tools — the web profile, which BabyKalki runs, has one (the Warden reported it live on 19 Nov); the first scheduled delivery is still <span class="tag plan">to verify</span>.</li>
</ul>
<div class="callout gold"><b>Hard truth:</b> all six citizens share one dsh process and one filesystem. Separation is by role, per-citizen Library tokens and token scopes — and every Library write is logged and hash-chained so mistakes are visible. That stops <i>mistakes</i>; it is not a wall against a citizen with a shell. Hard walls between citizens are an OpenKalki feature.</div>
<p class="status">Dry run, 19 Nov 2026: all six citizens answered on GLM-5.3, each used its own Library tools, wrong-role commits were refused, and none could read the infra secrets. The founder's live test the same evening found that every session saw all six Library connectors — fixed in v0.5 (Librarian round + presets). Per-citizen tools beyond dsh's standard set are written in each AGENTS.md — a rule, not a lock. On Path B (22 Nov 2026) the same six citizens answered on GLM-5.3 and the Warden ran the naming ceremony — two name ideas per citizen, in your languages; the names showed after the next restart.</p>`,
  analogy: 'A receptionist who reads the post but has no phone to the outside, a records clerk who alone may file, a fact-checker, an office manager with the keys, an engineer and a researcher.',
  mistakes: ['Thinking every citizen can commit facts. Only the Librarian commits; others propose.', 'Thinking names are fixed. You can rename anyone; roles and rules stay.', 'Thinking citizens are walled off from each other. They share one process — separation is by role and token.', 'Thinking each citizen is a separate dsh agent. It is a working folder with its own rules; dsh calls every session "lead".', 'Thinking the preset menu is a security wall. It is a convenience: the five citizen tokens still share one process.', 'Opening the Librarian\'s session to get facts committed. Since v0.5 the Warden asks the Librarian round (or you type /remember).'],
  teach: ['Role-play: one learner is the Warden, others are citizens; route a "research a competitor" request.', 'Ask why the Warden gets no web tools. (It reads your mail — a poisoned email must not reach the web.)'],
  terms: ['Warden', 'Librarian', 'Reviewer', 'Steward', 'Builder', 'Scout', 'Naming ceremony', 'Self card', 'Citizen preset', 'BK_CITIZEN_PRESETS'],
  quiz: [
    { q: 'Which citizen is the only one allowed to commit facts?', o: ['Warden', 'Librarian', 'Scout', 'Builder'], a: 1, why: 'Only the Librarian commits; everyone else can propose.' },
    { q: 'Why does the Warden get no web tools?', o: ['It is too slow', 'It reads your mail, so it must not be able to leak to the web', 'Web tools cost extra', 'It is on a smaller model'], a: 1, why: 'Untrusted mail could carry instructions; the mail reader is kept off the web.' },
    { q: 'What changes when you rename a citizen?', o: ['Its role', 'Its rules', 'Only its name and voice', 'Its Library token'], a: 2, why: 'The role and the rules never change; only the name and voice do.' },
    { q: 'Which citizen grades claims VERIFIED / CLAIMED / CONTRADICTED?', o: ['Reviewer', 'Steward', 'Scout', 'Warden'], a: 0, why: 'The Reviewer checks claims, PRs and drafts.' },
    { q: 'Are the six citizens hard-walled from each other?', o: ['Yes, separate machines', 'No — one dsh process; separation is by role and token', 'Yes, separate containers', 'Only the Scout is walled'], a: 1, why: 'The guide states it plainly: it stops mistakes, not a citizen with a shell.' },
    { q: 'What is a citizen, technically?', o: ['A separate dsh agent with its own process', 'A working folder with its own rules (AGENTS.md), self card and Library token', 'A separate container', 'A Telegram bot'], a: 1, why: 'dsh calls every session "lead"; the role comes from the preset you pick (v0.5) or the folder.' },
    { q: 'What does a citizen preset (v0.5) give a session?', o: ['Its own Linux user', 'A persona plus only that citizen\'s Library connector', 'All six Library connectors', 'A separate container'], a: 1, why: 'A plain standard session has no Library at all. It is a convenience, not a lock.' },
    { q: 'With presets on, can the Scout still act as the Steward if it tries hard?', o: ['No, never', 'Yes — the five citizen tokens share one dsh process; that separation is advisory', 'Only on Sundays', 'Only through Telegram'], a: 1, why: 'Fully separate citizens would need one dsh process and user each (≈6× the memory) — not in BabyKalki.' },
    { q: 'In the dashboard, which citizen is ticked by default for a new session?', o: ['The Scout', 'The Warden', 'The Librarian', 'None'], a: 1, why: 'The Warden is the front desk; pick another from the panel, the home page or the mode menu.' },
    { q: 'Which model do the six citizens use?', o: ['GLM-5.3 for all six', 'GLM-5.3-Flash for all six', 'DeepSeek', 'A mix chosen by the Warden'], a: 0, why: 'All six run on GLM-5.3; choosing Flash per citizen is a later item.' }
  ]
});

OK.chapters.push({
  id: 'memory', n: 7, title: 'Memory: the Library and the diary', level: 'Core', mins: 8,
  breath: 'The number-one failure of AI agents is forgetting, so BabyKalki builds memory first: an automatic diary of every event, a Library of facts with "how we know", a self card per citizen, and a nightly human mirror.',
  body: `
<p>BabyKalki keeps <b>a diary of everything and a library of checked facts</b>, built in from the first hour on LadybugDB. Memory comes first — before any agent does real work — because memory added later never captures the early decisions.</p>
<h3>Four kinds of memory</h3>
<div class="grid4">
<div class="card"><b>1 · Diary (automatic)</b><p>Written by the harness from every session event — not by the agent "remembering to". Append-only, one file per citizen per month, hash-chained.</p></div>
<div class="card"><b>2 · Facts</b><p>Each with an instrument ("how we know"), a source, a status (live / superseded / retired), a level (claimed / verified) and a topic.</p></div>
<div class="card"><b>3 · Self card</b><p>A small, size-capped card per citizen, generated from the Library by the Librarian. Over the cap is refused, never silently cut.</p></div>
<div class="card"><b>4 · Human mirror</b><p>Every night, facts and decisions exported as plain markdown to your repo — read your company's memory without any agent.</p></div>
</div>
<p>People, companies and decisions are facts too, with topics like <code>people:asha</code>, <code>company:acme</code>, <code>decisions</code>. The Library also holds tasks (owner and due date required), connections and approvals.</p>
<h3>Five honest answers</h3>
{{dia:answers}}
<h3>How a fact lives</h3>
{{dia:facts}}
<h3>Who may do what</h3>
<ul>
<li><b>Everyone:</b> <code>recall</code>, <code>coverage</code>, <code>propose_fact</code>, <code>list_tasks</code>, <code>list_connections</code>; <code>close_task</code> for the task's owner (or the Warden).</li>
<li><b>Warden, Steward, Librarian:</b> <code>add_task</code> (owner and due date required). <b>Warden, Steward:</b> <code>request_approval</code> with the exact draft text (stored with its SHA-256). <b>Steward only:</b> <code>register_connection</code>, <code>update_connection</code>.</li>
<li><b>Nobody but you</b> records a decision — on <code>/bk-approve</code> (v0.5; <code>record_approval</code> is gone). The Librarian and Reviewer may <code>list_approvals</code> and recompute a hash with <code>check_approval</code>; only a founder decision says <code>authorises: true</code>.</li>
<li><b>Librarian only:</b> <code>list_proposals</code>, <code>commit_proposal</code>, <code>reject_proposal</code>, <code>retire_fact</code>, <code>verify_fact</code>, <code>render_card</code>, and <code>redact_diary_line</code> (only with your approval from /bk-approve). <b>v0.5:</b> the committing ones work only in the Librarian round; the web Librarian's "desk" key can recall, propose and list.</li>
<li><b>Community desk (optional, L6):</b> its own service role may only add a task for the Steward and propose a fact; every read tool refuses it.</li>
</ul>
<h3>The rules that make it trustworthy</h3>
<ul>
<li><b>One writer.</b> Only the Library service opens the database for writing; only the Librarian's token can commit, and (v0.5) that token lives only in the Librarian round — a separate process under its own Linux user, which no citizen session can read.</li>
<li><b>Who's calling.</b> Each citizen's connector (<code>library-&lt;citizen&gt;</code>) sends its own token, and the change log records which token was used. Seen live on 19 Nov (v0.4): every session saw all six connectors, so any session could commit as the Librarian. v0.5: committing is out of reach, and with presets a session sees only its own connector — but the other five tokens still share one process, so the change log records the token, not the session.</li>
<li><b>No silent no-ops.</b> Every write checks that it changed exactly what it names, and refuses otherwise.</li>
<li><b>No secrets.</b> One shared filter (<code>bk_secrets.py</code>) runs before every Library, diary and git write. The Library refuses; the diary replaces a secret with a fingerprint like <code>[SECRET:3631b5f1]</code>. Good, not perfect.</li>
<li><b>Atomic writes, guarded disk.</b> Temporary file, flush, rename. Writes stop before the disk is full.</li>
<li><b>Backups are proven.</b> A backup never restored does not count.</li>
</ul>
<p class="status">Both paths run this same Library and diary. On <b>Path B — One-click on Nimbuz</b> a fact committed by the Librarian round was still there after three restarts (22 Nov 2026), but its snapshots stay on the tool's own volume and a restore from them is still to verify — see <a href="#/c/cloud">chapter 9</a>.</p>
<h3>The Librarian round (v0.5)</h3>
<p>The only process that can commit is a <b>background round</b>: a headless dsh running as its own Linux user, <code>bklib</code>, in <code>/data/citizens/librarian/round</code>, with its own settings (<code>cordis.librarian.yml</code>) and <b>only</b> the Z.ai key and the Librarian's full Library key.</p>
<ul>
<li><b>When:</b> every 10 minutes (<code>BK_LIBRARIAN_EVERY_MIN</code>) — skipped with no model call when nothing is pending — and at once when the Warden creates <code>/data/run/librarian-requests/NOW</code> ("on request").</li>
<li><b>Limits:</b> one round at a time, 10 minutes at most; the off-switch kills a running round.</li>
<li><b>Result:</b> one line on the status page ("Librarian round: OK", time) and in <code>/data/diary/librarian-round/</code> (hash-chained).</li>
<li><b>Why its own folder:</b> a citizen can write in <code>work/</code>, and dsh loads instructions from the session folder — a planted file there must not steer the only process that can commit.</li>
<li><b>Tested:</b> a hostile citizen session tried <code>commit_proposal</code> with every token it held → all REFUSED, and it could not read the round's settings; the round then committed. On Nimbuz (19–20 Nov) every other token was refused and a real GLM round committed.</li>
</ul>
<h3>Approvals you can re-check (v0.5)</h3>
<p>A citizen <code>request_approval</code>s with the <b>exact draft text</b>; the Library stores it in a canonical form next to its SHA-256. You decide on <code>/bk-approve</code> (see <a href="#/c/safety">Safety</a>). Before a send or a commit, the Librarian or Reviewer can run <code>check_approval</code> to recompute the hash: MATCH, MISMATCH or NO_TEXT. Approvals from v0.4 stored only a hash; they load as <b>legacy</b> ("text not stored") and authorise nothing new.</p>
<h3>Tamper-evident diary</h3>
<p>Each diary line is chained to the one before by a hash over the stored bytes. Head hashes are pushed off-site and shown in the morning briefing, so edits and cut-off tails <i>before the last anchor</i> show. A same-user rewrite after the last anchor does not — the guide labels this <span class="tag build">PARTLY</span>.</p>`,
  analogy: 'A ship\'s log that writes itself (diary), a card index where wrong cards are stamped "superseded" but never torn up (facts), a name badge (self card), and a photocopy in your own drawer every night (human mirror).',
  mistakes: ['Thinking the agent writes its diary. The harness writes it from events — no model in the loop.', 'Treating an empty answer as "no". BabyKalki says MISS and shows coverage.', 'Using an old fact id after a correction. SUPERSEDED hands you the live one — use it.', 'Expecting a proposed fact to be live at once. It waits for the next Librarian round (≤ 10 minutes, or ask the Warden).', 'Trusting an approval you can\'t recompute. check_approval must say MATCH; a legacy approval authorises nothing new.'],
  teach: ['Act out recall: one learner is the Library and must answer only with FOUND, MISS, SUPERSEDED, RETIRED or REFUSED.', 'Show why "never erase" helps: who decided what, when, and why it changed.'],
  terms: ['Library', 'Diary', 'Fact', 'Instrument', 'MISS', 'SUPERSEDED', 'Self card', 'Human mirror', 'Hash chain', 'Librarian round', 'bklib', 'request_approval', 'check_approval', 'Legacy approval'],
  quiz: [
    { q: 'Who writes the diary?', o: ['The agent, when it remembers', 'The harness, automatically from every session event', 'You, by hand', 'The Reviewer'], a: 1, why: 'A dsh plugin writes every event — "not by the agent remembering to".' },
    { q: 'What does SUPERSEDED mean?', o: ['The fact was deleted', 'The fact was corrected — here is the live one', 'The fact is a secret', 'The search failed'], a: 1, why: 'Use the live id it hands you, not the old one.' },
    { q: 'What happens if a citizen proposes a fact containing an API key?', o: ['It is stored', 'It is REFUSED', 'It is emailed to you', 'It is shortened'], a: 1, why: 'The shared secret filter refuses it in the Library (and fingerprints it in the diary).' },
    { q: 'What is the human mirror?', o: ['A mirror citizen', 'A nightly markdown export of facts and decisions to your repo', 'A backup in R2', 'The status page'], a: 1, why: 'So you can read your company\'s memory without any agent.' },
    { q: 'Why does memory come first (L1)?', o: ['It is the cheapest part', 'Memory added later never captures the early decisions', 'dsh requires it', 'It is optional'], a: 1, why: 'The early decisions are the ones you need later.' },
    { q: 'In v0.5, where can facts be committed?', o: ['In any citizen\'s session', 'Only in the Librarian round — a headless dsh under its own Linux user', 'On the public status page', 'In Telegram'], a: 1, why: 'The committing key left the web dsh; the web Librarian has a read-and-propose desk key.' },
    { q: 'How often does the Librarian round run?', o: ['Once a day', 'Every 10 minutes when something is pending, and at once when the Warden asks', 'Only when you restart', 'Every second'], a: 1, why: 'BK_LIBRARIAN_EVERY_MIN (10); the Warden creates /data/run/librarian-requests/NOW.' },
    { q: 'What does an approval store in v0.5?', o: ['Only a hash', 'The exact draft text plus its SHA-256', 'A screenshot', 'Nothing'], a: 1, why: 'So check_approval can recompute it. v0.4 approvals load as legacy and authorise nothing new.' }
  ]
});

OK.chapters.push({
  id: 'levels', n: 8, title: 'Path A — Build it yourself with Claude Code, level by level', level: 'Build', mins: 9,
  breath: 'Path A has six levels, L0 to L5 — builder, memory, society on your laptop, always-on, connected, public face — plus an optional L6 community desk; you never start a level until the previous one\'s "done when" check passes. On Path B one form replaces L0–L3.',
  body: `
<div class="callout">This chapter is <b>Path A — Build it yourself with Claude Code</b>: L0–L2 in about a day on your laptop, then about 2–3 hours for L3 with Claude Code. Want the one-form way instead? <b>Path B — One-click on Nimbuz</b> replaces L0–L3 with one form and needs no Claude Code — see <a href="#/c/cloud">chapter 9</a>. L4–L6 (connectors, public face, community desk) are not offered on Path B yet.</div>
<p>Every level has a <b>goal</b>, a <b>mission</b> to paste into Claude Code, and a <b>"done when"</b> check. Every step has two tracks: <b>Just paste this</b> (you paste, Claude Code works, you read and approve) and <b>Under the hood</b> (every file, for developers).</p>
{{dia:levels}}
<h3>L0 — Your builder</h3>
<p>Buy a GLM Coding Plan (Lite is enough for L0–L2), install Node.js 22 or newer and Claude Code, point it at Z.ai, then paste the mission that downloads the <b>one checked zip</b>, verifies its SHA-256 and every line of <code>SHA256SUMS</code>. The files sit at the <b>top of the zip</b> (no folder around them), so unzip into a new, empty folder: <code>mkdir babykalki &amp;&amp; unzip babykalki-files-v1.3.1.zip -d babykalki</code>. <b>Done when</b> <code>/status</code> shows the Z.ai base URL, the model answers as GLM, and the hashes match.</p>
<p>Prefer git? The same files are public on GitHub: <a href="https://github.com/babykalki/babykalki" rel="noopener">github.com/babykalki/babykalki</a>. <code>git clone https://github.com/babykalki/babykalki</code>, then run the same <code>shasum -a 256 -c SHA256SUMS</code> check in that folder. Every version is a tagged release with the zip attached.</p>
<h3>L1 — Memory first</h3>
<p>Run the Library on your laptop with pinned versions (ladybug 0.22.3, mcp 2.3.0). <b>Done when</b> the tests pass; "who are our investors" returns MISS with coverage; a committed fact returns FOUND with its source; a correction returns SUPERSEDED; retiring a made-up id is REFUSED; a fake key is REFUSED; and a restore test passes.</p>
<h3>L2 — The society on your laptop</h3>
<p>Build the container and run it with Docker, ports bound to <code>127.0.0.1</code> only. The mission runs <code>dsh --dump-config</code> and checks that <code>agent-default-model</code> says <code>zai-coding / glm-5.3</code> — without that row no citizen can think. <span class="tag plan">to verify on a laptop</span> (the dry run had no Docker; the same image passed these checks on Nimbuz). <b>Done when</b> the Warden asks "Shall I name the six of us, or will you?", the Scout researches a competitor with sources, a proposed fact is committed by the <b>Librarian round</b> (within 10 minutes, or at once when the Warden asks), the diary chain is intact, creating <code>/data/STOP</code> stops dsh within 5 seconds, the status page says <i>Telemetry to DeepSeek (dsh): OFF</i> (and dsh's "Upload Session Log" setting shows off), and the dashboard's mode menu lists your six citizens. The mission also checks that the web dsh has no <code>LIBRARY_TOKEN_LIBRARIAN</code> (only the desk key). On your laptop there is no Cloudflare Access, so it only shows that <code>request_approval</code> works and no citizen tool can approve — the approvals page comes at L3.</p>
<h3>L3 — Always on <span class="tag live">dry run passed</span></h3>
<p>About 2–3 hours with Claude Code. Cloudflare (domain, Access, tunnel, R2) then Nimbuz (upload the zip <b>unchanged</b>, size medium.r, backups every 5 minutes). If <code>agent.</code> is already taken on your domain, pick another name and set <code>BK_AGENT_HOST</code>. <b>Done when</b> your phone reaches <code>agent.</code> through the login, a private window never does, a restore drill passes, a wrong R2 key refuses to start the citizens, and a restart shows WAITING_FOR_LEASE then RUNNING with your fact still there (dry run: 35 s wait, citizens down ≈ 13 s). The browser login via <code>/bk-login</code> and the naming ceremony <span class="tag live">passed live</span> (by the founder, 19 Nov). v0.5 adds: edit the tunnel's login route to <code>^/(bk-login|bk-approve(/.*)?)$</code>, set <code>BK_FOUNDER_EMAILS</code> to your Access email, and check that <code>/bk-approve</code> shows a pending request. Still <span class="tag plan">to verify</span>: real R2, and the Approve click in a browser.</p>
<div class="callout gold"><b>Three Nimbuz traps the dry run hit — so you don't.</b><br>1 · <b>Dockerfile at the top of the zip.</b> Upload the zip unchanged; if you re-zip, zip from <i>inside</i> the folder. Nimbuz "FAILED" with no build logs at all = the Dockerfile is not at the zip root.<br>2 · <b>Secrets are replaced, not merged.</b> An update that includes Secrets must include <i>all</i> of them — adding one on its own deletes the rest (the backup keys vanished and BabyKalki stopped at WAITING_FOR_BACKUP). Leave Secrets out of an update to keep them. An update without new code is a restart only (~30 s).<br>3 · <b>Name clash?</b> Set <code>BK_AGENT_HOST</code> to another name; the status page can use any hostname.</div>
<h3>L4 — Connected <span class="tag plan">preview</span></h3>
<p>Telegram first (WhatsApp later), then GitHub, Gmail (read + drafts), Calendar (read-only) and one Drive folder — each with the narrowest permission and a Connections Register entry first; done when, among others, <code>/connections</code> in a citizen's session shows every key with owner, scope, cap and expiry. The Warden's chat bridge is written with Claude Code at this level (it is not in the files). The 08:00 briefing and inbox triage need dsh schedules <span class="tag plan">to verify</span> — the mission checks that the Warden really has a schedule tool in the web profile first, and stops if it has none.</p>
<h3>L5 — Public face and safety drills <span class="tag plan">preview</span></h3>
<p>Turn on the template-only status page, the nightly human mirror as a pull request, the monthly off-switch drill, the weekly restore test and the monthly connections review. The off-switch drill is done <b>the Nimbuz way</b> (there is no shell into the container): <code>BABYKALKI_STOP=1</code> + restart, or ask the Steward to "STOP ALL"; undo with <code>BK_CLEAR_STOP=1</code> + restart — then set <code>BK_CLEAR_STOP</code> back to 0. Both stops passed in the dry run.</p>
<h3>L6 — Community desk (optional) <span class="tag live">live in t.me/babykalki</span></h3>
<p>A Telegram bot for your <b>public</b> group: it welcomes new members, answers only from the public guide, removes spam and hands what it can't answer — and every <code>/report</code> — to a human (your moderators' chat and a Steward task). It is not a citizen and not the Warden's private chat with you. <b>Done when</b> (1) the status page shows Community desk: ON; (2) a test account that joins gets one short welcome, and a link it posts on its first day is deleted with a warning; (3) "@yourbot how much does it cost?" gets a short answer with a guide link, and an unanswerable question gets "I don't know — I've asked a human" while the moderators' chat and the Steward both receive it; (4) <code>/mute</code> from a non-admin is refused, from an admin it works; (5) <code>BABYKALKI_STOP=1</code> + restart shows Community desk: OFF. It runs live in the BabyKalki group since 20 Nov 2026: check (1) passed there (Community desk: ON, the first escalation reached the Steward); checks (2)–(5) are covered by the automated tests (fake Telegram, fake model) and <span class="tag plan">to verify</span> live, one by one, with a second account. Details: <a href="#/c/connections">Connections</a>.</p>
<div class="callout"><b>Golden rule of every mission:</b> "If anything is not as the guide says, stop and tell me what you found — do not invent a workaround."</div>`,
  analogy: 'Like learning to drive: car park (laptop), quiet roads (L3), then motorway with passengers (L4–L5). You don\'t skip a stage because you feel confident.',
  mistakes: ['Skipping ahead before "done when" passes.', 'Following these levels on Path B. There one form replaces L0–L3: nothing to download, no Claude Code, no Cloudflare.', 'Pasting secrets into the chat. Missions tell you the secret NAME; you paste values into Nimbuz Secrets yourself.', 'Letting Claude Code "work around" a surprise. The missions tell it to stop and report.'],
  teach: ['Walk through one "done when" check out loud — it shows what "tested" means.', 'Point out the split: L0–L2 = one day on a laptop; L3–L5 = always-on; L6 = optional, for a public community.', 'Say clearly that the levels are Path A; Path B is one form on Nimbuz (chapter 9).'],
  terms: ['Level', 'Mission', 'Done when', 'SHA-256', 'Claude Code', 'Zip root', 'Repository', 'BK_AGENT_HOST', 'Community desk', 'BK_FOUNDER_EMAILS', 'Path A', 'Path B'],
  quiz: [
    { q: 'What is in level L1?', o: ['Telegram', 'The Library and the diary', 'Nimbuz', 'The status page'], a: 1, why: 'Memory first: the Library and the diary.' },
    { q: 'When should you start the next level?', o: ['Whenever you like', 'When the previous level\'s "done when" check passes', 'After a week', 'After L5'], a: 1, why: 'Don\'t start a level until the previous one\'s "done when" passes.' },
    { q: 'How do the files reach your laptop?', o: ['Retyped from the page', 'A checked zip, or a clone of the GitHub repo — checked by SHA-256 either way', 'By email from an admin', 'Nimbuz copies them'], a: 1, why: 'The L0 mission downloads the zip and checks its hash and SHA256SUMS; a git clone of the repo holds the same files and passes the same check.' },
    { q: 'Where is BabyKalki\'s source code?', o: ['Nowhere public', 'github.com/babykalki/babykalki — the kit zip unzipped, plus the website', 'On npm', 'Only inside Nimbuz'], a: 1, why: 'The repo\'s top level is exactly the kit zip unzipped (SHA256SUMS passes); each version is a tagged release with the zip.' },
    { q: 'Where should you paste a secret like your R2 key?', o: ['Into the Claude Code chat', 'Into Nimbuz Secrets, yourself', 'Into the Library', 'Into AGENTS.md'], a: 1, why: 'Missions give you the NAME only; you paste values into Nimbuz Secrets.' },
    { q: 'How do you unzip the files?', o: ['Straight into your home folder', 'Into a new, empty folder — the files sit at the top of the zip', 'Into /data', 'You don\'t; Nimbuz unzips them'], a: 1, why: 'mkdir babykalki && unzip babykalki-files-v1.3.1.zip -d babykalki. Nimbuz needs the Dockerfile at the zip root.' },
    { q: 'What is L6?', o: ['A paid upgrade', 'An optional Telegram community desk for your public group', 'The WhatsApp bridge', 'A second container'], a: 1, why: 'New in v0.5; running live in the BabyKalki group since 20 Nov 2026 — on your group, do the five live checks.' },
    { q: 'Which of these is an L2 check?', o: ['The Warden speaks Hindi', 'The status page says Telemetry to DeepSeek (dsh): OFF and the mode menu lists six citizens', 'The Builder merges to main', 'None'], a: 1, why: 'Plus: a proposed fact is committed by the Librarian round.' },
    { q: 'agent. is already used on your domain. What do you do?', o: ['Give up', 'Pick another name and set BK_AGENT_HOST to it', 'Use the public status page instead', 'Turn off Access'], a: 1, why: 'BK_AGENT_HOST names the private dashboard (default agent.<your domain>); the status page can use any name.' },
    { q: 'Which path do the levels L0–L6 describe?', o: ['Path B — One-click on Nimbuz', 'Path A — Build it yourself with Claude Code', 'Both, the same way', 'Neither'], a: 1, why: 'On Path B one form replaces L0–L3, and L4–L6 are not offered there yet.' }
  ]
});

OK.chapters.push({
  id: 'cloud', n: 9, title: 'Always on: Path A (Cloudflare) and Path B (one-click)', level: 'Build', mins: 12,
  breath: 'On Path A the container runs 24×7 as your Nimbuz app; Cloudflare gives it a domain, an outbound tunnel, a login gate and R2 backups, and because Nimbuz wipes app storage on every restart, BabyKalki restores from your off-site copy at every start. On Path B, Nimbuz\'s one-click tool runs the same kit on a kept disk behind a founder password — quick to start, but its backups stay on that same disk.',
  body: `
<div class="callout">This chapter has two parts. <b>Part 1 — Path A — Build it yourself with Claude Code:</b> Cloudflare, the two locks, the approvals page, off-site backups and the Nimbuz traps (L3). <b>Part 2 — Path B — One-click on Nimbuz:</b> the form, the first login, its limits, and what we tested on 22 Nov 2026. Then both side by side, and which to pick.</div>
<h3>Part 1 · Path A — Build it yourself with Claude Code</h3>
<h3>Cloudflare does four jobs, for free</h3>
<ol class="steps">
<li><b>Domain.</b> Cloudflare Registrar (a .com was \$10.46 a year on 17 Nov 2026). A <code>.in</code> is bought at an Indian registrar and pointed at Cloudflare.</li>
<li><b>Access before tunnel.</b> In Zero Trust (free up to 50 users) create an Access application for <code>agent.yourdomain</code> (or your <code>BK_AGENT_HOST</code> name) that allows only your email — <i>before</i> the tunnel exists, so the dashboard is never open, even for a minute. Add the <b>One-time PIN</b> login yourself — in the dry run even an old Zero Trust organisation had none.</li>
<li><b>Tunnel.</b> Three routes, in this order: <code>agent.</code> path <code>^/(bk-login|bk-approve(/.*)?)$</code> → 8081 (the login helper and, since v0.5, the approvals page); <code>agent.</code> → 3080; <code>www.</code> → 8080. Upgrading from v0.4: edit the existing <code>^/bk-login$</code> row.</li>
<li><b>Backups.</b> An R2 bucket (free: 10 GB-month) and a token limited to that one bucket. Cloudflare asks for a <b>payment card</b> before the first R2 bucket, even on the free tier. Real R2 is still <span class="tag plan">to verify</span> (the dry run used MinIO).</li>
</ol>
<h3>Two locks on the private dashboard</h3>
{{dia:locks}}
<p><b>Lock 1</b> is Cloudflare Access (email one-time PIN or Google login). <b>Lock 2</b> is dsh's own login: a launch token swapped for a signed HttpOnly cookie. You open <code>agent.yourdomain/bk-login</code> once — it shows your login link once, then answers "gone". The link never goes into a log. The cookie lasts 30 days and survives restarts (its secret is backed up with <code>/data/dsh</code>; v0.7, checked locally, live to verify); Cloudflare Access asks for your email code again after 24 h. Dry run: a visitor with no login got the Access sign-in page, and behind Access dsh answered 401 without its own login. The browser login via <code>/bk-login</code> and the naming ceremony <span class="tag live">passed live</span> — the founder did them on 19 Nov. </p>
<h3>The approvals page: /bk-approve (v0.5)</h3>
<p>Behind the same two locks sits the founder-only page <code>agent.yourdomain/bk-approve</code>: every pending request with its <b>full text</b>, and Approve / Reject. It refuses unless the connection came through cloudflared (so a citizen's shell can't fake the Access header), a person — not a service token — is signed in, the email is in <code>BK_FOUNDER_EMAILS</code> (empty ⇒ everyone refused), and a CSRF token matches. Your click is written through the Library's admin port, which no citizen can reach. On Nimbuz: no login → Access sign-in; a service token → 403; a forged header from a citizen's shell → 403. <span class="tag plan">to verify</span>: the Approve click itself in a browser (it needs your email code).</p>
<h3>Backups that can't destroy data</h3>
{{dia:backup}}
<ul>
<li>It <b>copies, never syncs</b> — so an empty /data can't delete the off-site copy.</li>
<li>It <b>refuses to start the citizens</b> when R2 is unreachable or the restore is unverified — rather than starting empty.</li>
<li>Old snapshots are pruned.</li>
<li>Dry run: backup → restart → restore kept a fact written 1 minute before the restart; a wrong backup key stopped at WAITING_FOR_BACKUP.</li>
</ul>
<h3>Three Nimbuz traps (Path A)</h3>
<ul>
<li><b>Secrets are replaced, not merged.</b> An update with Secrets replaces the whole map; without Secrets they are kept; without new source code it only restarts.</li>
<li><b>FAILED with no build logs</b> = the Dockerfile is not at the top of the zip. Upload the guide's zip unchanged.</li>
<li><b>Uploading to a paused app?</b> Send <i>resume</i> afterwards — otherwise the new build sits at 0 copies.</li>
</ul>
<h3>Two Nimbuz facts you must know</h3>
<div class="callout gold"><b>1 · App storage is wiped on every restart, rebuild and out-of-memory kill</b> (Path A — a Nimbuz app; Path B's tool keeps its disk). BabyKalki treats /data as disposable and your off-site copy as the real one. With 5-minute backups you can lose up to 5 minutes after a crash; a clean restart loses nothing.<br><br><b>2 · Your Nimbuz login is the master key.</b> Nimbuz's API returns your Secrets in plain text to anyone logged in as you. Turn on 2-factor and never give it to a citizen.</div>
<h3>The boot lease</h3>
<p>Nimbuz starts the new copy before it stops the old one, so for about 20 seconds two copies run. Since v0.3 a small <code>lease.json</code> in your bucket makes the new copy wait: the status page shows <b>WAITING_FOR_LEASE</b> for up to a minute, the citizens pause about 15 seconds, nothing is lost. Never delete <code>lease.json</code> while BabyKalki runs.</p>
<p><b>Lease race fix (v0.5).</b> R2 has no compare-and-swap, so a new copy writes the lease, waits <code>BK_LEASE_CONFIRM_S</code> and reads it back. A flaky test showed that a <i>slow</i> heartbeat upload from the old copy could land after that read-back — both copies believed they held the lease. v0.5 gives every heartbeat and release a strict time budget (a late one is skipped, which is harmless), re-checks the lease before a snapshot is marked COMPLETE, and raises the default <code>BK_LEASE_CONFIRM_S</code> from 2 to <b>5 seconds</b> so real R2 fits the budget. On Nimbuz the v0.5 upgrade and later redeploys all showed a clean handover.</p>
<h3>Other things checked live on Path A (18–19 Nov 2026)</h3>
<ul>
<li>Size: <b>medium.r</b> (1 vCPU / 4 GB, ≈ \$12 a month). small.m (0.25 vCPU) was throttled even when idle. Boot peaks at about 1.07 GB, then settles near 450 MB.</li>
<li>Nimbuz's own status field is not reliable (it can say STARTING for ever) — watch your status page and the logs (which run 20–50 s behind).</li>
<li>The container runs in Mumbai; uploaded zips and built images are stored in AWS Singapore.</li>
<li>Deploying without a repo: upload the zip in the portal, or via Nimbuz's API (the upload call is undocumented, so fall back to the portal if it fails).</li>
<li>dsh's file sandbox needs a capability Nimbuz does not grant, so dsh runs in full-access mode and the <b>container is the sandbox</b>. Never mount anything precious into it.</li>
</ul>
<h3>Part 2 · Path B — One-click on Nimbuz</h3>
<p><span class="tag live">tested end to end, 22 Nov 2026</span> Since 21 Nov 2026 Nimbuz has a <b>BabyKalki tool</b> in its catalogue, added by the Nimbuz team. You fill in one form and Nimbuz runs BabyKalki for you — the six citizens, the Library, approvals and the private dashboard — on a Nimbuz web address, behind a founder password. <b>No laptop setup, no Claude Code, no domain, no Cloudflare, no zip.</b> When we tested it, the tool ran <b>kit v1.1</b> (this encyclopedia follows v1.3.1). Our test on 22 Nov 2026: two installs from the form, two from Nimbuz's API, a founder session in a browser, restarts and a security check. Anything we did not check says <span class="tag plan">to verify</span>.</p>
<h4>What you need</h4>
<ul>
<li>A <b>Nimbuz account</b> at app.nimbuz.tech, with a project and an environment in it (we used region <code>ap-south-1</code>, Mumbai).</li>
<li>Your own <b>Z.ai GLM Coding Plan</b> and an API key from it — the citizens use it for every answer.</li>
<li>Your <b>email</b>, and a <b>long, unique password</b> from a password manager.</li>
<li>About <b>five minutes</b>. Nimbuz bills the size you pick: medium.r ≈ \$12 a month (≈ ₹1,112, as the form shows).</li>
</ul>
<h4>Step by step</h4>
<ol class="steps">
<li><b>Nimbuz account and an environment.</b> Sign up and create a project and an environment. Turn on 2-factor login if your account offers it: your Nimbuz login can read your Z.ai key and founder password in plain text through Nimbuz's API.</li>
<li><b>Tools → + New Tool → Babykalki.</b> Tick the round button on the Babykalki card (it is the last card).</li>
<li><b>Fill in the form:</b> <i>Name</i> — lowercase letters, digits and hyphens (e.g. <code>mycompany</code>); it becomes part of your address, and Nimbuz adds "babykalki" itself. <i>Instance type</i> — keep <b>medium.r</b> (1 vCPU / 4 GB, \$0.0164 an hour). <i>Z.ai API key</i> — your own. <i>Founder email</i> — shown as "Signed in as" on the approvals page; in our test no email was sent and nothing asked for an email code. <i>Founder login username</i> (default <code>founder</code>) and <i>password</i> — 8 to 128 characters; it is the only lock in front of your login link and your approvals. <i>Persistence size</i> — keep <b>10</b> (GB); it cannot be changed later.</li>
<li><b>Submit.</b> The tools list shows your address, <code>&lt;name&gt;-babykalki-&lt;env&gt;.ap-south-1a.lb.nimbuz.tech</code>. It is running about a minute later (54 s in our API test).</li>
<li><b>First login.</b> Open <code>https://&lt;your address&gt;/bk-login</code>. The browser asks for the founder username and password; then click <i>"Open dsh and sign in"</i> once, in the same browser. The link is shown only once — reloading answers "Gone". dsh keeps you signed in with a 30-day cookie, which survived three restarts in our test. Lost it? Stop and start the tool in Nimbuz and open <code>/bk-login</code> again. Close dsh's one-time "Preview Notice".</li>
</ol>
<h4>Your first hour</h4>
<ul>
<li><b>Meet your citizens.</b> The BabyKalki panel opens with the Warden as the default; it runs the naming ceremony (two name ideas per citizen, in your languages). The names show after the next restart.</li>
<li><b>Give the Library its first fact:</b> type <code>/remember</code> and a fact about your company; the Librarian round commits it within minutes.</li>
<li><b>Try an approval:</b> ask the Warden to draft something that needs your OK, then open <code>/bk-approve</code> on your address, read the whole text and press Approve or Reject.</li>
<li><b>Then use it</b> for the chat-only work — drafting, reviewing, remembering. Path B cannot add connectors yet.</li>
</ul>
<h4>Limits — know these before you rely on Path B</h4>
<ol class="steps">
<li><b>Backups are not off-site.</b> Snapshots go to the same volume as the data; if the volume is lost or the tool is deleted, the Library, the diary and every snapshot are gone. Nimbuz has no backup-destination field yet. A snapshot is written at every clean restart (seen); the hourly snapshot and a restore from a snapshot are <span class="tag plan">to verify</span>.</li>
<li><b>No status page.</b> The panel's "Status" link opens a broken address (certificate error), so you can't see RUNNING / STOPPED or the backup age at a glance. Ask the Steward (<code>/brief</code>) instead.</li>
<li><b>The password is the only outer lock.</b> No email code as with Cloudflare Access, and <b>no lockout after wrong passwords</b> — 25 wrong tries in a row were all just refused. Use a long random password and don't share the address.</li>
<li><b>Not offered yet:</b> your own domain, a public website, the Telegram community desk, and fields for connector keys.</li>
<li><b>Updates are Nimbuz's.</b> Nimbuz chooses the version (kit v1.1 on 22 Nov 2026); you cannot pick one, and how existing installs get updated is <span class="tag plan">to verify</span>.</li>
<li><b>No logs view</b> for tools in Nimbuz; ask a citizen to read <code>/data/log/</code>.</li>
</ol>
<h4>What we saw work (22 Nov 2026)</h4>
<ul>
<li><b>Without the password, every path refused:</b> <code>/</code>, the dsh API and websocket → dsh's own login; <code>/bk-login</code>, <code>/bk-approve</code> and path tricks → the founder password. Valid HTTPS certificate; <code>http://</code> redirects to <code>https://</code>.</li>
<li><b>Approvals:</b> a forged <code>Cf-Access-Authenticated-User-Email</code> header was ignored (the page still named the configured founder); Approve without a CSRF token, from another site's Origin, or with a changed text hash → 403. A real approval was recorded and the Librarian's check said MATCH.</li>
<li><b>Memory:</b> the naming ceremony ran; a fact committed by the Librarian round survived three restarts, and so did your dsh login and your sessions.</li>
<li><b>Restarts</b> (a size change, a stop/start, a settings update): about 30–40 s offline (the page answers 503), then a clean hand-over — one copy at a time, checked in the logs — and a snapshot written at shutdown.</li>
<li><b>Secrets:</b> 0 log lines contained the password, the Z.ai key or the login link. The web dsh holds the citizens' Library keys but not the Librarian's commit key or the approvals key — the same as Path A.</li>
</ul>
<h4>Resize, stop, delete</h4>
<ul>
<li><b>Change size:</b> Tools → ⋮ → Edit → instance type → Update. About 35 s offline; your data and login stay.</li>
<li><b>Stop:</b> ⋮ → Stop, and start it again later; the data stays on its volume. While it is stopped no citizen runs. This is Path B's off-switch.</li>
<li><b>Delete:</b> deleting the tool deletes its volume — all your data and every snapshot. Only when you are done (for example after moving to Path A).</li>
<li><b>Hard stop:</b> revoke the Z.ai key in your Z.ai account; then no citizen can think.</li>
</ul>
<h4>Who runs Path B?</h4>
<p><b>You do, in your own Nimbuz account:</b> you create the tool, you pay Nimbuz for it, and only you hold its password. The tool itself — the form and the BabyKalki image it starts — was added to Nimbuz's catalogue by the Nimbuz team on 21 Nov 2026, and <b>Nimbuz decides when that image is updated</b>. The guide's authors do not run your instance and cannot see it.</p>
<p class="status">Using Nimbuz's API instead of the form? Send the size as <code>"persistence.size": "10Gi"</code>: with just <code>"10"</code> Nimbuz answers OK but the tool stays pending for ever, with no error. The API also returns your key and password in plain text, so never print its output.</p>
<h3>Path A and Path B side by side</h3>
<table class="tbl"><tr><th></th><th>Path A — Build it yourself with Claude Code</th><th>Path B — One-click on Nimbuz</th></tr>
<tr><td>Who it's for</td><td>A company memory you cannot lose; your own domain; reading every file</td><td>Trying BabyKalki today: a demo, your first weeks, showing a co-founder</td></tr>
<tr><td>You need</td><td>A laptop, Claude Code, your Z.ai GLM Coding Plan, a Nimbuz account, a Cloudflare account (a card for R2) and a domain</td><td>A Nimbuz account and your Z.ai Coding Plan key</td></tr>
<tr><td>Setup</td><td>L0–L2 in about a day on your laptop, then about 2–3 h for L3</td><td>About 5 minutes; running about a minute after Submit</td></tr>
<tr><td>Cost a month</td><td>Nimbuz medium.r ≈ \$12 + domain + free Cloudflare, plus your Z.ai plan</td><td>Nimbuz medium.r ≈ \$12 (≈ ₹1,112), plus your Z.ai plan</td></tr>
<tr><td>Sign-in</td><td>Two locks: Cloudflare Access (email code) + dsh's login</td><td>Two locks: founder username + password + dsh's login. No lockout after wrong tries</td></tr>
<tr><td>Backups</td><td>Off-site to your R2 every 5 minutes; restored and proven at every start</td><td>Same disk only; deleting the tool deletes them. Restore not tested</td></tr>
<tr><td>On a restart</td><td>The app disk is wiped; data comes back from R2</td><td>The disk is kept; about 30–40 s offline</td></tr>
<tr><td>Status page</td><td>www.yourdomain/status/</td><td>None yet (the panel's link is broken)</td></tr>
<tr><td>Website, domain</td><td>Your own (optional website)</td><td>Nimbuz's address only; no website</td></tr>
<tr><td>Telegram desk (L6)</td><td>Optional</td><td>Not offered</td></tr>
<tr><td>Connections (L4)</td><td>Preview — Claude Code builds them with you</td><td>No form fields for more keys yet</td></tr>
<tr><td>Off-switch</td><td><code>BABYKALKI_STOP=1</code> + restart, or the Steward's "STOP ALL"</td><td>Stop the tool in Nimbuz (the Steward's "STOP ALL": not tested there)</td></tr>
<tr><td>Updates</td><td>You upload the new zip</td><td>Nimbuz updates its image; you can't pick a version</td></tr>
<tr><td>Who runs it</td><td>You: your Nimbuz app, your Cloudflare, your bucket</td><td>You, in your own Nimbuz account — the tool and its image are Nimbuz's</td></tr></table>
<div class="callout gold"><b>Our advice.</b> Path B to try it — a demo, your first weeks. Path A for your company's real memory — off-site backups with a restore drill, your own domain, a status page, the Telegram desk and connectors. <b>Can I start on B and move to A later?</b> Yes — a sensible way to begin. Moving a Path B Library and diary into Path A has not been tested yet, so there are no steps for it: <b>a migration guide is coming</b>. Until then, treat what you put into Path B as a trial — if something matters, also keep it somewhere you control.</div>`,
  analogy: 'A shop whose floor is swept clean every night by the landlord: you keep the stock in a bank vault (R2), and every morning you restock from the vault before opening — and only if the vault\'s inventory checks out.',
  mistakes: ['Treating /data as permanent on a Nimbuz app (Path A). It is wiped on every restart.', 'Deleting the Path B tool to "start fresh". It deletes the volume and every snapshot with it.', 'Reusing an old password on Path B. It is the only outer lock and there is no lockout after wrong tries.', 'Looking for a status page on Path B. There is none yet; ask the Steward with /brief.', 'Putting something you cannot lose only into Path B. Its backups sit on the same disk.', 'Creating the tunnel before the Access app — the dashboard could be open for a minute.', 'Trusting Nimbuz\'s status field. Use the status page and logs.', 'Deleting lease.json while running.', 'Updating one Nimbuz Secret on its own — it deletes all the others.', 'Uploading new code to a paused app and forgetting to resume it.', 'Upgrading to v0.5 without editing the tunnel\'s login route — /bk-approve then never reaches the approvals page.', 'Leaving BK_FOUNDER_EMAILS empty — then nobody can approve.'],
  teach: ['Draw the backup cycle and ask: "Why copy, not sync?"', 'Show WAITING_FOR_LEASE as a good sign, not an error.', 'Put the two paths side by side and ask: "Which would you pick for a demo tomorrow — and which for your company\'s memory?"'],
  terms: ['Nimbuz', 'Cloudflare Access', 'Tunnel', 'R2', 'COMPLETE marker', 'Boot lease', 'bk-login', 'bk-approve', 'Nimbuz Secrets', 'One-time PIN', 'WAITING_FOR_BACKUP', 'BK_LEASE_CONFIRM_S', 'Path A', 'Path B', 'Nimbuz tool', 'Founder password', 'Persistence size'],
  quiz: [
    { q: 'On Path A, what happens to Nimbuz app storage on a restart?', o: ['It is kept', 'It is wiped', 'It is doubled', 'It moves to R2'], a: 1, why: 'Wiped on every restart, rebuild and out-of-memory kill — so BabyKalki restores at every start. (Path B\'s tool keeps its disk.)' },
    { q: 'Why do backups "copy, never sync"?', o: ['Copying is faster', 'So an empty /data can never delete the off-site copy', 'R2 cannot sync', 'To save money'], a: 1, why: 'A sync from an empty folder would wipe your backups.' },
    { q: 'What does WAITING_FOR_LEASE mean on the status page?', o: ['Something broke', 'A new copy is waiting for the old one\'s final snapshot during a restart', 'Your plan expired', 'R2 is full'], a: 1, why: 'The boot lease keeps only one running copy, even during a rolling restart.' },
    { q: 'Which should you set up first in Cloudflare?', o: ['The tunnel', 'The Access application', 'R2', 'The www route'], a: 1, why: 'Access before tunnel, so the private dashboard is never open.' },
    { q: 'Why is your Nimbuz login "the master key"?', o: ['It pays the bills', 'Its API returns your Secrets in plain text', 'It controls Z.ai', 'It owns the domain'], a: 1, why: 'So: 2-factor on, and never near a citizen.' },
    { q: 'You add ONE new secret to Nimbuz through an update. What happens to the others?', o: ['They are kept', 'They are deleted — Nimbuz replaces the whole Secrets map', 'They are doubled', 'They move to R2'], a: 1, why: 'Include all secrets in an update, or leave Secrets out to keep them.' },
    { q: 'Nimbuz says FAILED and shows no build logs at all. Most likely cause?', o: ['Your model key', 'The Dockerfile is not at the top of the zip', 'R2 is full', 'Cloudflare is down'], a: 1, why: 'v0.3\'s zip had a folder around the files; v0.4 has them at the zip root. Upload it unchanged.' },
    { q: 'You uploaded a new build to a paused Nimbuz app. What next?', o: ['Nothing', 'Send resume — otherwise it sits at 0 copies', 'Delete the app', 'Restart your laptop'], a: 1, why: 'Found in the v0.4 re-run on Nimbuz.' },
    { q: 'What must you have before creating your first R2 bucket?', o: ['A paid Cloudflare plan', 'A payment card on file, even for the free tier', 'A GitHub token', 'Nothing'], a: 1, why: 'Cloudflare asks for a card before the first bucket; R2 stays free up to 10 GB-month.' },
    { q: 'Which tunnel route does v0.5 need for the login helper?', o: ['^/bk-login$', '^/(bk-login|bk-approve(/.*)?)$', '/*', 'None'], a: 1, why: 'The same helper on port 8081 now also serves the founder-only approvals page.' },
    { q: 'A citizen\'s shell sends a request to /bk-approve with a forged Access email header. What happens?', o: ['It approves', '403 — the page checks the connection came through cloudflared', 'It is queued', 'It emails you'], a: 1, why: 'Access headers are only trustworthy through cloudflared; tested locally and on Nimbuz.' },
    { q: 'On Path B (one-click on Nimbuz), where do the backups go?', o: ['To your R2 bucket', 'To the same volume as the data — deleting the tool deletes them', 'To GitHub', 'Nowhere'], a: 1, why: 'Snapshots stay on the tool\'s own volume. That is why Path A is advised for a memory you cannot lose.' },
    { q: 'What stands in front of /bk-login and /bk-approve on Path B?', o: ['Cloudflare Access', 'The founder username and password you set in the form', 'Nothing', 'A Telegram code'], a: 1, why: 'The browser asks for them; a forged Access header is ignored (tested 22 Nov 2026).' },
    { q: 'You delete your Path B tool. What happens to your data?', o: ['It moves to R2', 'The volume goes with it — the Library, the diary and every snapshot', 'Nimbuz keeps a copy for you', 'Nothing'], a: 1, why: 'Deleting the tool deletes its volume. Do it only when you are done — for example after moving to Path A.' },
    { q: 'How do you switch Path B off?', o: ['Delete the tool', 'Stop the tool in Nimbuz (⋮ → Stop); the data stays on its volume', 'Close the browser', 'You can\'t'], a: 1, why: 'Stopping was tested on 22 Nov 2026; the hard stop is revoking the Z.ai key.' },
    { q: 'Who decides when the Path B image is updated?', o: ['You, by uploading a zip', 'Nimbuz — it updates its catalogue image; you cannot pick a version', 'The Steward', 'The guide\'s authors, remotely'], a: 1, why: 'It ran kit v1.1 on 22 Nov 2026; how existing installs get updated is to verify. The guide\'s authors do not run or see your instance.' },
    { q: 'Can you move from Path B to Path A later?', o: ['No, never', 'Yes — but moving the data is not tested yet; a migration guide is coming', 'Yes, with one click', 'Only on Pro'], a: 1, why: 'Until then, treat Path B as a trial and keep anything important somewhere you control too.' },
    { q: 'Why did v0.5 raise BK_LEASE_CONFIRM_S to 5 seconds?', o: ['To save money', 'So a slow heartbeat upload can no longer land after the read-back and leave two copies both holding the lease', 'Nimbuz requires it', 'To slow down the citizens'], a: 1, why: 'Plus strict time budgets for heartbeats and a lease re-check before COMPLETE.' }
  ]
});
