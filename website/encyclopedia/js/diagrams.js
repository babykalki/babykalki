/* BabyKalki Encyclopedia — diagrams (inline SVG, no external assets) */
window.OK = window.OK || {};
(function () {
  var uidN = 0;
  function uid() { return 'u' + (++uidN) + Math.random().toString(36).slice(2, 6); }

  /* ---------- The lotus mark (BRAND.md §2: 9 petals, 3 bands, gold seed) ---------- */
  function lotus(size) {
    var id = uid(), S = 1.09, B = 26.4;
    var bands = [[82, 11.5, 6.4, .30, 'd'], [58, 14.5, 6.4, .48, 'd'], [35, 16.5, 6.2, .70, 'f'], [16, 18.0, 5.8, .90, 'f']];
    function petal(L, W) {
      L *= S; W *= S;
      return 'M16 ' + B + ' C' + (16 - W) + ' ' + (B - .30 * L) + ' ' + (16 - .75 * W) + ' ' + (B - .95 * L) + ' 16 ' + (B - L) +
        ' C' + (16 + .75 * W) + ' ' + (B - .95 * L) + ' ' + (16 + W) + ' ' + (B - .30 * L) + ' 16 ' + B + 'Z';
    }
    var p = '';
    bands.forEach(function (b) {
      [-1, 1].forEach(function (s) {
        p += '<path d="' + petal(b[1], b[2]) + '" transform="rotate(' + (s * b[0]) + ' 16 ' + B + ')" fill="url(#' + id + b[4] + ')" opacity="' + b[3] + '"/>';
      });
    });
    p += '<path d="' + petal(19, 6.2) + '" fill="url(#' + id + 'f)"/>';
    return '<svg class="lotus" width="' + size + '" height="' + size + '" viewBox="0 0 32 32" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4B3FD6"/><stop offset="1" stop-color="#3A2FA8"/></linearGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4DCFF"/><stop offset=".5" stop-color="#8E7DFF"/><stop offset="1" stop-color="#4B3FD6"/></linearGradient>' +
      '<radialGradient id="' + id + 'g" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE9A8"/><stop offset="1" stop-color="#E0A92B"/></radialGradient>' +
      '</defs>' + p + '<circle cx="16" cy="23.9" r="1.95" fill="url(#' + id + 'g)"/></svg>';
  }
  OK.lotus = lotus;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function box(x, y, w, h, title, sub, cls, data) {
    return '<g class="node ' + (cls || '') + '"' + (data ? ' data-inst="' + data + '" tabindex="0" role="button"' : '') + '>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + (sub ? h / 2 - 3 : h / 2 + 5)) + '" class="t1">' + esc(title) + '</text>' +
      (sub ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 13) + '" class="t2">' + esc(sub) + '</text>' : '') + '</g>';
  }
  function arrow(x1, y1, x2, y2, cls) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="ar ' + (cls || '') + '" marker-end="url(#okarr)"/>';
  }
  function svg(vb, inner, label) {
    return '<figure class="dia"><svg viewBox="' + vb + '" role="img" aria-label="' + esc(label) + '">' +
      '<defs><marker id="okarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8E7DFF"/></marker></defs>' +
      inner + '</svg><figcaption>' + esc(label) + '</figcaption></figure>';
  }
  function txt(x, y, s, cls) { return '<text x="' + x + '" y="' + y + '" class="' + (cls || 't2') + '">' + esc(s) + '</text>'; }

  var D = {};

  /* The map — interactive (tiles carry data-inst → OK.inst) */
  D.map = function () {
    var g = '';
    g += txt(180, 12, 'PATH A · BUILD — your laptop', 'cap');
    g += box(8, 20, 168, 46, 'Your laptop', 'Claude Code builds', 'human', 'laptop');
    g += box(184, 20, 168, 46, 'Z.ai GLM plan', 'the brain (glm-5.3)', 'office', 'zai');
    g += arrow(92, 66, 92, 96);
    g += txt(100, 86, 'deploys the zip', 't3 l');
    g += txt(180, 108, 'RUN — one container on Nimbuz (Mumbai)', 'cap');
    g += '<rect x="4" y="114" width="352" height="262" rx="14" class="frame"/>';
    g += box(14, 122, 332, 40, 'bk_supervisor', 'starts everything · STOP switch · infra user', 'forge', 'supervisor');
    g += box(14, 170, 332, 44, 'dsh on 127.0.0.1', 'the harness where the six citizens live', 'office', 'dsh');
    var cz = [['warden', 'Warden'], ['librarian', 'Librarian'], ['reviewer', 'Reviewer'], ['steward', 'Steward'], ['builder', 'Builder'], ['scout', 'Scout']];
    cz.forEach(function (c, i) {
      var x = 14 + i * 56;
      g += '<g class="node guild live" data-inst="c-' + c[0] + '" tabindex="0" role="button" aria-label="' + c[1] + '"><rect x="' + x + '" y="220" width="52" height="30" rx="8"/><text x="' + (x + 26) + '" y="239" class="t2" style="fill:var(--tx);font-weight:700;font-size:9.5px">' + c[1] + '</text></g>';
    });
    g += box(14, 258, 162, 46, 'Library service', 'the only writer', 'office', 'library');
    g += box(184, 258, 162, 46, 'cloudflared · bk_static', 'tunnel out · status page', 'guild', 'tunnel');
    g += box(14, 312, 332, 52, '/data', 'library · diary · cards · site · backups', 'muted', 'data');
    g += arrow(180, 376, 180, 398);
    g += txt(188, 392, 'outbound tunnel + backup copies', 't3 l');
    g += box(8, 400, 344, 46, 'Cloudflare', 'domain · Tunnel · Access login · R2 backups', 'forge', 'cloudflare');
    g += arrow(60, 446, 60, 466); g += arrow(180, 446, 180, 466); g += arrow(300, 446, 300, 466, 'dash');
    g += box(8, 468, 108, 50, 'www.', 'public status', 'guild', 'www');
    g += box(126, 468, 108, 50, 'agent.', 'private · 2 locks', 'office', 'agent');
    g += box(244, 468, 108, 50, 'hooks.', 'planned', 'outside', 'hooks');
    g += box(90, 532, 180, 40, 'You', 'phone or browser', 'human', 'you');
    return svg('0 0 360 580', g, 'Path A — Build it yourself with Claude Code, at a glance — tap any box');
  };

  /* The six levels */
  D.levels = function () {
    var L = [['L0', 'Your builder', 'Claude Code on your own GLM plan', 'set-up checked', 'done'], ['L1', 'Memory first', 'the Library and the diary', 'tested locally', 'done'],
      ['L2', 'The society', 'six citizens in Docker on your laptop', 'parts tested', 'done'], ['L3', 'Always on', 'Nimbuz + Cloudflare + backups', 'dry run + live', 'now'],
      ['L4', 'Connected', 'Telegram, GitHub, Gmail, Calendar', 'preview', ''], ['L5', 'Public face', 'status page + safety drills', 'preview', ''],
      ['L6', 'Community desk', 'optional Telegram bot for your group', 'live in our group', '']];
    var g = '<line x1="30" y1="24" x2="30" y2="' + (24 + (L.length - 1) * 62) + '" class="rail"/>';
    L.forEach(function (s, i) {
      var y = 24 + i * 62;
      g += '<circle cx="30" cy="' + y + '" r="15" class="dot ' + s[4] + '"/><text x="30" y="' + (y + 4) + '" class="s" style="font-weight:800">' + s[0] + '</text>';
      g += '<text x="56" y="' + (y - 3) + '" class="t1 l">' + esc(s[1]) + '</text><text x="56" y="' + (y + 13) + '" class="t2 l">' + esc(s[2]) + '</text>';
      g += '<text x="352" y="' + (y + 4) + '" class="t3 r ' + (s[4] ? 'st ' + s[4] : '') + '">' + esc(s[3]) + '</text>';
      if (i === 2) g += '<text x="180" y="' + (y + 36) + '" class="cap">— DAY ONE ENDS · ALWAYS-ON BEGINS —</text>';
    });
    return svg('0 0 360 ' + (48 + (L.length - 1) * 62), g, 'Path A: six levels plus an optional L6 — don\'t start one until the previous "done when" passes (Path B: one form replaces L0–L3)');
  };

  /* Library answers */
  D.answers = function () {
    var A = [['FOUND', 'best live facts, ranked, with sources', 'p0'], ['MISS', 'nothing matched — plus what IS known', 'p1'],
      ['SUPERSEDED', 'corrected — here is the live one', 'p2'], ['RETIRED', 'no longer applies — use nothing', 'p3'],
      ['REFUSED', 'not written: no-op, wrong caller, secret', 'p4']];
    var g = box(100, 6, 160, 40, 'recall("…")', 'a citizen asks', 'guild');
    A.forEach(function (a, i) {
      var y = 64 + i * 50;
      g += '<g class="pill ' + a[2] + '"><rect x="8" y="' + y + '" width="344" height="42" rx="21"/>' +
        '<text x="24" y="' + (y + 26) + '" class="t1 l">' + a[0] + '</text><text x="120" y="' + (y + 26) + '" class="t2 l" style="font-size:10px">' + esc(a[1]) + '</text></g>';
    });
    g += txt(180, 324, 'Never a silent empty answer. Never a silent no-op.', 't3');
    return svg('0 0 360 334', g, 'The five answers the Library can give');
  };

  /* Fact lifecycle */
  D.facts = function () {
    var g = '';
    g += box(8, 10, 104, 46, 'propose_fact', 'any citizen', 'guild');
    g += arrow(112, 33, 128, 33);
    g += box(130, 10, 100, 46, 'Proposal', 'pending', 'muted');
    g += arrow(230, 33, 246, 33);
    g += box(248, 10, 104, 46, 'Live fact', 'Librarian round', 'office');
    g += arrow(300, 56, 300, 86);
    g += box(220, 88, 132, 46, 'Superseded', 'by a newer fact + reason', 'guild');
    g += arrow(250, 56, 120, 92, 'dash');
    g += box(8, 88, 160, 46, 'Retired', 'moot — with a reason', 'guild');
    g += txt(180, 160, 'There is no delete tool. Facts are corrected, never erased.', 't3');
    g += txt(180, 176, '(One exception: a personal-data erasure, with your approval.)', 't3');
    return svg('0 0 360 186', g, 'How a fact lives');
  };

  /* Backup cycle */
  D.backup = function () {
    var S = [['Snapshot', '/data → a dated copy'], ['Push to R2', 'copy, never sync'], ['COMPLETE marker', 'written last'], ['Restore at start', 'newest COMPLETE only'], ['Restore test', 'counts + hashes vs manifest']];
    var g = '';
    S.forEach(function (s, i) {
      var y = 8 + i * 58;
      g += box(60, y, 240, 46, s[0], s[1], i === 4 ? 'office' : 'guild');
      if (i < S.length - 1) g += arrow(180, y + 46, 180, y + 56);
    });
    g += '<path d="M300 268 C 352 268, 352 31, 302 31" class="ar dash" marker-end="url(#okarr)"/>';
    g += txt(354, 150, 'every 5 min', 't3 r');
    g += txt(180, 308, 'An empty /data can never delete the off-site copy.', 't3');
    return svg('0 0 360 318', g, 'Backups that can\'t destroy data');
  };

  /* Approval flow */
  D.approval = function () {
    var n = [['You ask', 'Telegram or the private dashboard', 'human'], ['Warden', 'turns it into a task with an owner + date', 'office'],
      ['Builder / Scout', 'does the work, drafts the result', 'guild'], ['Reviewer', 'checks facts, tests, rights, labels', 'guild'],
      ['Your approval', 'on /bk-approve: exact text + SHA-256', 'human'], ['Leaves the system', 'email sent · PR merged · post published', 'outside']];
    var g = '';
    n.forEach(function (s, i) {
      var y = 6 + i * 60;
      g += box(40, y, 280, 46, s[0], s[1], s[2]);
      if (i < n.length - 1) g += arrow(180, y + 46, 180, y + 58);
    });
    return svg('0 0 360 362', g, 'Agents prepare, you decide');
  };

  /* Two locks */
  D.locks = function () {
    var g = '';
    g += box(8, 10, 110, 46, 'You', 'phone / browser', 'human');
    g += arrow(118, 33, 134, 33);
    g += box(136, 10, 104, 46, 'Lock 1', 'Cloudflare Access', 'office');
    g += arrow(240, 33, 256, 33);
    g += box(258, 10, 94, 46, 'Lock 2', 'dsh login cookie', 'office');
    g += arrow(305, 56, 305, 80);
    g += box(214, 82, 138, 46, 'dsh', '127.0.0.1 only', 'forge');
    g += box(8, 82, 190, 46, 'A stranger', 'no login → never sees dsh', 'outside');
    g += txt(180, 152, 'Nothing listens to the internet for the agents —', 't3');
    g += txt(180, 166, 'cloudflared dials OUT to Cloudflare.', 't3');
    return svg('0 0 360 176', g, 'The private dashboard on Path A: two locks (Path B: the founder password, then the same dsh login)');
  };

  /* Two ways to get BabyKalki (v1.3) */
  D.paths = function () {
    var g = '';
    g += txt(90, 14, 'PATH A', 'cap'); g += txt(270, 14, 'PATH B', 'cap');
    g += box(8, 22, 164, 46, 'Build it yourself', 'with Claude Code', 'human');
    g += box(188, 22, 164, 46, 'One-click', 'on Nimbuz', 'human');
    g += arrow(90, 68, 90, 84); g += arrow(270, 68, 270, 84);
    g += box(8, 86, 164, 46, 'Your laptop', 'Claude Code + your GLM plan', 'office');
    g += box(188, 86, 164, 46, 'Nimbuz Tools', 'one form · about 5 min', 'office');
    g += arrow(90, 132, 90, 148); g += arrow(270, 132, 270, 148);
    g += box(8, 150, 164, 46, 'Nimbuz app + Cloudflare', 'own domain · R2 backups', 'forge');
    g += box(188, 150, 164, 46, 'Nimbuz tool', 'Nimbuz address · same disk', 'forge');
    g += arrow(90, 196, 150, 220); g += arrow(270, 196, 210, 220);
    g += box(60, 222, 240, 50, 'The same BabyKalki', 'six citizens · Library · approvals · dashboard', 'guild');
    g += txt(180, 292, 'A: your real company memory · B: try it, demos, first weeks', 't3');
    return svg('0 0 360 302', g, 'Two ways to get BabyKalki: Path A — Build it yourself with Claude Code, or Path B — One-click on Nimbuz');
  };

  /* Family tree: Beast → OpenKalki → BabyKalki */
  D.lineage = function () {
    var e = [['The Beast', 'Robin\'s first always-on system — taught every hard lesson', 'muted'], ['OpenKalki', 'a full society of AI agents: own servers, offices, guilds', 'office'], ['BabyKalki', 'six citizens, one container, your existing services', 'human']];
    var g = '';
    e.forEach(function (s, i) {
      var y = 8 + i * 70;
      g += box(30, y, 300, 50, s[0], s[1], s[2]);
      if (i < e.length - 1) g += arrow(180, y + 50, 180, y + 68);
    });
    return svg('0 0 360 ' + (8 + 3 * 70 - 10), g, 'Where BabyKalki comes from');
  };

  OK.dia = D;
})();
