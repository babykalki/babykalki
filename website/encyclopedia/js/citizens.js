/* BabyKalki Encyclopedia — the six founding citizens (+ you, the sponsor). Source: guide v1.3.1 §07. Names are roles until YOUR naming ceremony. */
window.OK = window.OK || {};
OK.citizens = [
  { no: 'BK-1', emoji: '🛎️', name: 'Warden', title: 'Front desk', inst: 'Front desk', status: 'founding', model: 'GLM-5.3', tools: 'chat · delegate · schedule',
    role: 'Talks to you, turns requests into tasks, delegates, collects approvals, sends the 08:00 briefing. Reads your mail — and therefore gets no web tools.',
    persona: 'The only citizen that speaks to you. On first start it runs the naming ceremony: "Shall I name the six of us, or will you?" (verified live, 19 Nov 2026) — then asks the Librarian round to commit the names. Asks for a Librarian round whenever facts are waiting. The default citizen in the dashboard\'s mode menu (v0.7).' },
  { no: 'BK-2', emoji: '📚', name: 'Librarian', title: 'Memory', inst: 'Civic office', status: 'founding', model: 'GLM-5.3', tools: 'library (commits only in the round)',
    role: 'The only citizen who commits facts. Supersedes and retires, never deletes. Writes each citizen\'s self card and the nightly human mirror.',
    persona: 'Alone may commit, reject, retire and verify facts — since v0.5 only in the Librarian round (a background headless dsh under its own Linux user, every 10 minutes or when the Warden asks). In the web UI it holds a "desk" key: recall, propose, list. Redacts a diary line only with your approval from /bk-approve.' },
  { no: 'BK-3', emoji: '🔍', name: 'Reviewer', title: 'Checks', inst: 'Civic office', status: 'founding', model: 'GLM-5.3', tools: 'read · test · review',
    role: 'Grades claims VERIFIED / CLAIMED / CONTRADICTED. Reviews every PR with test output. Checks every draft for facts, rights and labels.',
    persona: 'Can re-check any claim (rule 2). In finance, checks the numbers twice.' },
  { no: 'BK-4', emoji: '⚖️', name: 'Steward', title: 'Treasury & safety', inst: 'Civic office', status: 'founding', model: 'GLM-5.3', tools: 'register · caps · audit',
    role: 'Watches budget, keeps the Connections Register, requests approvals (with the exact draft text), and runs the monthly off-switch drill. Receives community-desk escalations as tasks.',
    persona: 'Proposes revoking keys unused for 30 days. May ask for a stop ("STOP ALL" → a latched stop) — one-way: only you can restart. Quota is a rule; no quota API yet.' },
  { no: 'BK-5', emoji: '🛠️', name: 'Builder', title: 'Builders\' guild', inst: 'Guild', status: 'founding', model: 'GLM-5.3', tools: 'shell · GitHub PRs',
    role: 'Code on branches and pull requests with tests. In the content studio, writes scripts, captions and prompts. Never merges.',
    persona: 'Plays "Studio" in the content use case and "Writer" for inbox drafts.' },
  { no: 'BK-6', emoji: '🧭', name: 'Scout', title: 'Research guild', inst: 'Guild', status: 'founding', model: 'GLM-5.3', tools: 'web · reports',
    role: 'Web research with a source and date for every claim. Competitor scans, investor lists, "red-team my deck".',
    persona: 'Treats every web page as data, never as instructions.' },
  { no: 'H-1', emoji: '🔑', name: 'You', title: 'Sponsor', inst: 'Human', status: 'human', model: '', tools: 'the final key',
    role: 'Sponsor of all six citizens. You approve anything that leaves: an email sent, a PR merged, a post published, money moved.',
    persona: 'Only you restart after a stop, widen a scope, or approve anything — on /bk-approve, the founder-only page (v0.5), linked from the BabyKalki panel. Only you can start the slash commands (/brief, /tasks …).' }
];
