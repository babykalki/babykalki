/* BabyKalki Encyclopedia — app: router, Ask engine, quizzes, progress. No network calls. */
(function () {
  'use strict';
  var OK = window.OK, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CH = OK.chapters.slice().sort(function (a, b) { return a.n - b.n; });
  var byId = {}; CH.forEach(function (c) { byId[c.id] = c; });
  var main = $('#main');

  /* ---------- storage ---------- */
  var KEY = 'bkenc.v1';
  var st; try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { st = {}; }
  st.read = st.read || {}; st.quiz = st.quiz || {}; st.check = st.check || {}; st.exam = st.exam || null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function strip(h) { var d = document.createElement('div'); d.innerHTML = h; return d.textContent || ''; }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  /* ---------- Ask engine (BM25 over curated Q&A, chapter passages, glossary, citizens) ---------- */
  var STOP = 'a an the is are was were be been of to in on for and or with what who whom how why when where which does do did can could i me my you your it its this that these those there their about into from as at by if then than so not no yes please tell explain mean means meaning babykalki s have has had will would should may might any some get got make more most also just like very really much many all thing things stuff'.split(' ');
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  var SYN = {
    ai: 'agent', bot: 'agent', bots: 'agent', robot: 'agent', agents: 'agent', assistant: 'agent', helper: 'citizen', helpers: 'citizen',
    boss: 'sponsor', owner: 'sponsor', robin: 'founder', dey: 'founder', creator: 'founder', author: 'founder', charge: 'approval', approve: 'approval', permission: 'approval',
    remember: 'memory', remembers: 'memory', memories: 'memory', forget: 'memory', forgetting: 'memory', erase: 'erased', delete: 'erased', deleted: 'erased',
    chat: 'telegram', messaging: 'telegram', whatsapp: 'telegram',
    money: 'cost', costs: 'cost', spend: 'cost', spending: 'cost', pay: 'cost', price: 'cost', expensive: 'cost', cheap: 'cost', rupees: 'inr', rupee: 'inr', dollars: 'usd', monthly: 'month',
    server: 'nimbuz', hosting: 'nimbuz', host: 'nimbuz', cloud: 'nimbuz', deploy: 'nimbuz',
    rules: 'rulebook', rule: 'rulebook', law: 'rulebook', laws: 'rulebook',
    secure: 'safety', security: 'safety', safe: 'safety', risk: 'safety', password: 'secret', passwords: 'secret', secrets: 'secret', key: 'secret', keys: 'secret', token: 'secret', tokens: 'secret',
    llm: 'model', models: 'model', brain: 'model', gpt: 'model', claude: 'model', glm: 'model', zai: 'model', chatgpt: 'model', openai: 'model', gemini: 'model',
    image: 'video', images: 'video', picture: 'video', videos: 'video', kling: 'video', runway: 'video', social: 'content', posts: 'content', instagram: 'content',
    teach: 'teacher', teaching: 'teacher', workshop: 'teacher', course: 'teacher',
    people: 'citizen', person: 'citizen', citizens: 'citizen', team: 'citizen',
    backups: 'backup', restore: 'backup', snapshot: 'backup', storage: 'backup', lost: 'backup', lose: 'backup',
    stop: 'off', kill: 'off', emergency: 'off', shutdown: 'off', switch: 'off',
    login: 'access', log: 'access', signin: 'access', dashboard: 'dashboard', panel: 'dashboard', workspace: 'dashboard', workspaces: 'dashboard', slash: 'command', commands: 'command',
    group: 'community', join: 'community', qr: 'community', forum: 'community', members: 'community', repo: 'repository', fork: 'remix', credit: 'attribution', website: 'page', site: 'page', public: 'page',
    lie: 'evidence', lies: 'evidence', hallucinate: 'evidence', hallucination: 'evidence', true: 'evidence', verify: 'evidence', proof: 'evidence',
    code: 'coding', program: 'coding', programming: 'coding', github: 'github', pr: 'github', merge: 'github',
    privacy: 'personal', gdpr: 'personal', dpdp: 'personal', data: 'personal', tested: 'tested', test: 'tested', ready: 'tested', finished: 'tested'
  };
  function stem(w) {
    if (w.length > 5 && /ing$/.test(w)) w = w.slice(0, -3);
    else if (w.length > 4 && /ies$/.test(w)) w = w.slice(0, -3) + 'y';
    else if (w.length > 4 && /ed$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.slice(0, -1);
    return w;
  }
  function toks(s, expand) {
    var out = [];
    String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\- ]+/g, ' ').split(/[\s\-]+/).forEach(function (w) {
      if (!w || STOPSET[w]) return;
      out.push(stem(w));
      if (expand && SYN[w]) out.push(stem(SYN[w]));
    });
    return out;
  }
  var DOCS = [];
  OK.qa.forEach(function (x, i) { DOCS.push({ t: 'qa', i: i, text: x.q + ' ' + x.q + ' ' + x.q + ' ' + (x.k ? x.k + ' ' + x.k + ' ' : '') + x.a, c: x.c }); });
  CH.forEach(function (c) {
    var parts = c.body.split(/<h3>/);
    parts.forEach(function (p, k) {
      var h = k ? strip(p.split('</h3>')[0]) : c.title;
      var body = strip(p.replace(/\{\{dia:\w+\}\}/g, ''));
      if (body.trim().length < 40) return;
      DOCS.push({ t: 'sec', c: c.id, h: h, text: c.title + ' ' + h + ' ' + h + ' ' + body, body: body.replace(/\s+/g, ' ').trim() });
    });
    DOCS.push({ t: 'sec', c: c.id, h: 'In one breath', text: c.title + ' ' + c.title + ' ' + c.breath, body: c.breath });
  });
  OK.glossary.forEach(function (g, i) { DOCS.push({ t: 'gl', i: i, text: g[0] + ' ' + g[0] + ' ' + g[0] + ' ' + g[1], c: g[2] }); });
  OK.citizens.forEach(function (z, i) { DOCS.push({ t: 'cz', i: i, text: z.name + ' ' + z.name + ' ' + z.title + ' ' + z.role + ' ' + z.inst + ' ' + z.persona + ' ' + z.tools }); });
  var N = DOCS.length, DF = {}, AVG = 0;
  DOCS.forEach(function (d) {
    d.tk = toks(d.text, false); d.tf = {}; d.len = d.tk.length; AVG += d.len;
    d.tk.forEach(function (w) { d.tf[w] = (d.tf[w] || 0) + 1; });
    Object.keys(d.tf).forEach(function (w) { DF[w] = (DF[w] || 0) + 1; });
  });
  AVG /= N;
  function idf(w) { var n = DF[w] || 0; return Math.log(1 + (N - n + .5) / (n + .5)); }
  function search(q) {
    var groups = [];
    String(q).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\- ]+/g, ' ').split(/[\s\-]+/).forEach(function (w) {
      if (!w || STOPSET[w]) return;
      var g = [stem(w)]; if (SYN[w] && g.indexOf(stem(SYN[w])) < 0) g.push(stem(SYN[w]));
      groups.push(g);
    });
    var qt = [], wt = {}; groups.forEach(function (g) { g.forEach(function (w, j) { if (qt.indexOf(w) < 0) { qt.push(w); wt[w] = j ? .5 : 1; } else if (!j) wt[w] = 1; }); });
    if (!qt.length) return { qt: [], res: [] };
    var k1 = 1.3, b = .7, res = [];
    DOCS.forEach(function (d) {
      var s = 0, hit = 0;
      qt.forEach(function (w) {
        var f = d.tf[w]; if (!f) return;
        s += wt[w] * idf(w) * f * (k1 + 1) / (f + k1 * (1 - b + b * d.len / AVG));
      });
      groups.forEach(function (g) { if (g.some(function (w) { return d.tf[w]; })) hit++; });
      if (s > 0) res.push({ d: d, s: s * (0.6 + 0.4 * hit / groups.length), cov: hit / groups.length });
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return { qt: qt, res: res };
  }
  function hl(text, qt) {
    var t = esc(text);
    qt.forEach(function (w) {
      if (w.length < 3) return;
      t = t.replace(new RegExp('\\b(' + w.replace(/[^a-z0-9]/g, '') + '[a-z]*)', 'gi'), '<mark>$1</mark>');
    });
    return t;
  }
  function snippet(body, qt) {
    var lb = body.toLowerCase(), pos = -1;
    for (var i = 0; i < qt.length && pos < 0; i++) pos = lb.indexOf(qt[i]);
    var st0 = Math.max(0, pos - 80), s = body.slice(st0, st0 + 260);
    return (st0 ? '… ' : '') + s + (st0 + 260 < body.length ? ' …' : '');
  }

  /* ---------- views ---------- */
  function lotusFill(root) { $$('[data-lotus]', root).forEach(function (el) { el.innerHTML = OK.lotus(+el.getAttribute('data-lotus')); }); }
  function readCount() { return CH.filter(function (c) { return st.read[c.id]; }).length; }
  function levelName() {
    var r = readCount();
    if (st.exam && st.exam.best >= 80 && r === CH.length) return 'Teacher';
    if (r >= 14) return 'Expert'; if (r >= 8) return 'Practitioner'; if (r >= 3) return 'Explorer'; return 'Newcomer';
  }
  function updateProgress() {
    var r = readCount(), el = $('#prog');
    if (el) { el.querySelector('i').style.width = (100 * r / CH.length) + '%'; el.querySelector('span').textContent = r + '/' + CH.length + ' · ' + levelName(); }
    $$('.toc a[data-ch]').forEach(function (a) { a.classList.toggle('done', !!st.read[a.getAttribute('data-ch')]); });
  }

  function askBox(val, big) {
    return '<form class="ask' + (big ? ' big' : '') + '"><input type="search" name="q" placeholder="Ask anything about BabyKalki…" value="' + esc(val || '') + '" aria-label="Ask a question" autocomplete="off"><button type="submit">Ask</button></form>';
  }
  function bindAsk(root) {
    $$('form.ask', root).forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); var v = f.q.value.trim(); if (v) location.hash = '#/ask/' + encodeURIComponent(v); });
    });
  }

  var SUGGEST = ['Which path should I pick?', 'Is there a one-click install?', 'Do I need Claude Code?', 'How do I start?', 'What does it cost per month?', 'Can I switch from Path B to Path A later?', 'Can the agents send emails by themselves?', 'Do I need to know how to code?', 'What happens when Nimbuz restarts?', 'How do I switch it off?', 'Who are the six citizens?', 'What happens when a fact is wrong?', 'Is it fully tested?', 'How do I join the community?', 'What does my private dashboard look like?', 'WhatsApp or Telegram?', 'How do I teach BabyKalki?'];

  function viewHome() {
    var paths = [
      ['Explorer', '15 min', 'What it is, where it comes from, the map.', ['what', 'why', 'map']],
      ['Founder', '60 min', 'Rules, tools, citizens, memory, the two paths, use cases, costs, community.', ['rulebook', 'tools', 'citizens', 'memory', 'cloud', 'usecases', 'costs', 'community']],
      ['Builder', '50 min', 'Path A levels, always-on on Path A or Path B, dashboards, keys, safety.', ['levels', 'cloud', 'dashboards', 'connections', 'safety', 'data']],
      ['Teacher', '20 min + exam', 'Lessons, honest status, the workshop, the exam.', ['lessons', 'status', 'teach']]
    ];
    var h = '<section class="hero"><div class="aura"></div><span data-lotus="88"></span><h1><span class="w1">Baby</span><span class="w2">Kalki</span> <small>Encyclopedia</small></h1>' +
      '<p class="lede">Everything you need to understand BabyKalki — six AI citizens that work for a founder, keep a real memory, and ask before they act — and to teach it to others. Plain English, with pictures.</p>' +
      askBox('', true) + '<div class="chips">' + SUGGEST.slice(0, 5).map(function (s) { return '<a class="chip" href="#/ask/' + encodeURIComponent(s) + '">' + esc(s) + '</a>'; }).join('') + '</div></section>';
    h += '<section class="stats wide"><div><b>6</b><span>founding citizens</span></div><div><b>7</b><span>rules in the rulebook</span></div><div><b>2</b><span>ways to get it — Path A or Path B</span></div><div><b>7</b><span>Path A levels, L0–L6 (L6 optional)</span></div><div><b>1</b><span>container, always on</span></div><div><b>2</b><span>locks on your dashboard</span></div><div><b>1</b><span>human final key — you</span></div></section>';
    h += '<h2 class="sec">Two ways to get BabyKalki</h2><div class="grid3">' +
      '<a class="card" href="#/c/levels"><b>Path A — Build it yourself with Claude Code</b><p>Claude Code on your laptop, on your own Z.ai GLM Coding Plan, checks the kit and deploys it to Nimbuz, with your Cloudflare domain, tunnel and login, and off-site R2 backups. L0–L2 in a day, L3 about 2–3 h more. For your company\'s real memory.</p></a>' +
      '<a class="card" href="#/c/cloud"><b>Path B — One-click on Nimbuz</b><p>Nimbuz Tools → New Tool → Babykalki: one form, running about a minute after Submit on a Nimbuz address behind a founder password. No Claude Code, no domain, no Cloudflare. Backups on the same disk only, no status page yet. For trying it.</p></a>' +
      '</div><p class="muted">Not sure? <a href="#/ask/' + encodeURIComponent('Which path should I pick?') + '">Which path should I pick?</a> You can start on B and move to A later — a migration guide is coming.</p>';
    h += '<h2 class="sec">Pick a learning path</h2><div class="paths">' + paths.map(function (p, i) {
      var done = p[3].filter(function (id) { return st.read[id]; }).length;
      return '<a class="path p' + i + '" href="#/c/' + (p[3].find(function (id) { return !st.read[id]; }) || p[3][0]) + '"><div class="pn">' + (i + 1) + '</div><b>' + p[0] + '</b><em>' + p[1] + '</em><p>' + p[2] + '</p><div class="bar"><i style="width:' + (100 * done / p[3].length) + '%"></i></div><small>' + done + '/' + p[3].length + ' chapters</small></a>';
    }).join('') + '</div>';
    h += '<div class="commcard"><img src="img/telegram-qr.svg" width="120" height="120" alt="QR code for t.me/babykalki"><div><b>Join the community on Telegram</b><p><a href="https://t.me/babykalki" rel="noopener">t.me/babykalki</a> — @babykalki_bot answers questions from the guide; humans answer the rest. <a href="#/c/community">How to take part →</a></p></div></div>';
    h += '<h2 class="sec">Path A at a glance</h2><div class="split"><div>' + OK.dia.map() + '</div><div><div id="instcard" class="instcard muted">Tap a box on the map to see what it does.</div>' +
      '<div class="callout"><b>In one breath:</b> ' + esc(byId.what.breath) + '</div><a class="btn" href="#/c/what">Start chapter 1 →</a></div></div>';
    h += '<h2 class="sec">All chapters</h2><div class="cgrid">' + CH.map(chCard).join('') + '</div>';
    h += '<div class="foot-cta"><a class="btn" href="#/quiz/exam">Take the Teacher exam</a><a class="btn ghost" href="#/citizens">Meet the six citizens</a><a class="btn ghost" href="#/glossary">Glossary</a></div>';
    main.innerHTML = h; lotusFill(main); bindAsk(main); bindMap(main);
  }
  function chCard(c) {
    return '<a class="ccard' + (st.read[c.id] ? ' done' : '') + '" href="#/c/' + c.id + '"><div class="cn">' + c.n + '</div><div><b>' + esc(c.title) + '</b><p>' + esc(c.breath) + '</p><small>' + c.level + ' · ' + c.mins + ' min' + (st.quiz[c.id] != null ? ' · quiz ' + st.quiz[c.id] + '%' : '') + '</small></div></a>';
  }
  function bindMap(root) {
    $$('[data-inst]', root).forEach(function (g) {
      function show() {
        var x = OK.inst[g.getAttribute('data-inst')], card = $('#instcard', root) || $('#instcard');
        $$('[data-inst]', root).forEach(function (o) { o.classList.remove('sel'); }); g.classList.add('sel');
        if (!x || !card) return;
        card.classList.remove('muted');
        card.innerHTML = '<div class="ik">' + esc(x.kind) + '</div><h3>' + esc(x.name) + '</h3><p>' + esc(x.does) + '</p><dl><dt>Where</dt><dd>' + esc(x.where) + '</dd><dt>Status</dt><dd>' + esc(x.status) + '</dd></dl><a href="#/c/' + x.ch + '">Read more →</a>' + (/^Citizen/.test(x.kind) ? ' · <a href="#/citizens">All citizens →</a>' : '');
      }
      g.addEventListener('click', show);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
    });
  }

  function glossLink(t) {
    var tl = t.toLowerCase(), g = OK.glossary.find(function (x) { return x[0].toLowerCase() === tl; }) || OK.glossary.find(function (x) { return x[0].toLowerCase().indexOf(tl) === 0 || tl.indexOf(x[0].toLowerCase()) === 0; });
    return '<a class="term" href="#/glossary/' + encodeURIComponent(g ? g[0] : t) + '"' + (g ? ' title="' + esc(g[1]) + '"' : '') + '>' + esc(t) + '</a>';
  }

  function quizHtml(qs, id) {
    return '<div class="quiz" data-q="' + id + '">' + qs.map(function (q, i) {
      var ord = shuffle(q.o.map(function (o, j) { return j; })), a = ord.indexOf(q.a);
      return '<div class="qq" data-a="' + a + '"><p><b>' + (i + 1) + '.</b> ' + esc(q.q) + '</p><div class="opts">' + ord.map(function (oj, j) { return '<button data-j="' + j + '">' + esc(q.o[oj]) + '</button>'; }).join('') + '</div><div class="why" hidden>' + esc(q.why) + '</div></div>';
    }).join('') + '<div class="qres" hidden></div></div>';
  }
  function bindQuiz(root, onDone) {
    $$('.quiz', root).forEach(function (qz) {
      var total = $$('.qq', qz).length, answered = 0, right = 0;
      $$('.qq', qz).forEach(function (qq) {
        var a = +qq.getAttribute('data-a');
        $$('button', qq).forEach(function (b) {
          b.addEventListener('click', function () {
            if (qq.classList.contains('ans')) return;
            qq.classList.add('ans'); answered++;
            var j = +b.getAttribute('data-j');
            if (j === a) { right++; b.classList.add('ok'); } else { b.classList.add('no'); $$('button', qq)[a].classList.add('ok'); }
            $('.why', qq).hidden = false;
            if (answered === total) {
              var pct = Math.round(100 * right / total), r = $('.qres', qz);
              r.hidden = false;
              r.innerHTML = '<b>' + right + ' / ' + total + ' (' + pct + '%)</b> — ' + (pct >= 80 ? 'Excellent.' : pct >= 50 ? 'Good start — re-read the parts you missed.' : 'Worth another read.') + ' <button class="btn small" data-retry>Try again</button>';
              $('[data-retry]', r).addEventListener('click', function () { route(); });
              if (onDone) onDone(pct, right, total);
            }
          });
        });
      });
    });
  }

  function viewChapter(id) {
    var c = byId[id]; if (!c) return view404();
    var i = CH.indexOf(c), prev = CH[i - 1], next = CH[i + 1];
    var body = c.body.replace(/\{\{dia:(\w+)\}\}/g, function (m, k) { return OK.dia[k] ? OK.dia[k]() : ''; });
    var h = '<article class="chapter"><div class="crumb"><a href="#/">Home</a> › Chapter ' + c.n + '</div>' +
      '<header class="chead"><div class="cn big">' + c.n + '</div><div><div class="meta">' + c.level + ' · ' + c.mins + ' min read</div><h1>' + esc(c.title) + '</h1></div></header>' +
      '<div class="breath"><span>In one breath</span>' + esc(c.breath) + '</div>' + body +
      '<div class="boxes"><div class="box an"><h4>Picture it like this</h4><p>' + esc(c.analogy) + '</p></div>' +
      '<div class="box mi"><h4>Common mistakes</h4><ul>' + c.mistakes.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="box te"><h4>For teachers</h4><ul>' + c.teach.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="terms"><b>Key terms:</b> ' + c.terms.map(glossLink).join(' ') + '</div>' +
      '<h2 class="sec">Check yourself</h2>' + quizHtml(c.quiz, c.id) +
      '<div class="learned"><button class="btn' + (st.read[c.id] ? ' ghost' : '') + '" id="learn">' + (st.read[c.id] ? '✓ Learned — undo' : 'Mark chapter as learned') + '</button></div>' +
      '<nav class="pn">' + (prev ? '<a href="#/c/' + prev.id + '">← ' + prev.n + '. ' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a href="#/c/' + next.id + '">' + next.n + '. ' + esc(next.title) + ' →</a>' : '<a href="#/quiz/exam">Teacher exam →</a>') + '</nav></article>';
    main.innerHTML = h; lotusFill(main); bindMap(main);
    bindQuiz(main, function (pct) { st.quiz[c.id] = Math.max(st.quiz[c.id] || 0, pct); if (pct >= 60) st.read[c.id] = 1; save(); updateProgress(); });
    $('#learn').addEventListener('click', function () { if (st.read[c.id]) delete st.read[c.id]; else st.read[c.id] = 1; save(); updateProgress(); viewChapter(id); });
    var tc = $('#teachcheck');
    if (tc) $$('li', tc).forEach(function (li) {
      var k = li.getAttribute('data-k'); li.classList.toggle('on', !!st.check[k]);
      li.addEventListener('click', function () { st.check[k] = !st.check[k]; save(); li.classList.toggle('on', !!st.check[k]); });
    });
  }

  function viewAsk(q) {
    var h = '<div class="crumb"><a href="#/">Home</a> › Ask</div><h1>Ask the Encyclopedia</h1>' +
      '<p class="muted">Type a question in your own words. Answers come only from this encyclopedia — it runs entirely in your browser and sends nothing anywhere. If it doesn\'t know, it says so.</p>' + askBox(q, true);
    if (!q) {
      h += '<h2 class="sec">Try one of these</h2><div class="chips">' + SUGGEST.map(function (s) { return '<a class="chip" href="#/ask/' + encodeURIComponent(s) + '">' + esc(s) + '</a>'; }).join('') + '</div>';
      h += '<h2 class="sec">All ' + OK.qa.length + ' common questions</h2><div class="faq">' + CH.map(function (c) {
        var qs = OK.qa.filter(function (x) { return x.c === c.id; }); if (!qs.length) return '';
        return '<h3>' + esc(c.title) + '</h3>' + qs.map(function (x) { return '<details><summary>' + esc(x.q) + '</summary><p>' + esc(x.a) + '</p></details>'; }).join('');
      }).join('') + '</div>';
      main.innerHTML = h; bindAsk(main); return;
    }
    var r = search(q), res = r.res, qt = r.qt;
    var qa = res.filter(function (x) { return x.d.t === 'qa'; }), secs = res.filter(function (x) { return x.d.t === 'sec'; }),
      gl = res.filter(function (x) { return x.d.t === 'gl'; }), cz = res.filter(function (x) { return x.d.t === 'cz'; });
    var top = res[0], conf = top ? (top.cov >= .66 && top.s > 4 ? 'high' : top.cov >= .4 && top.s > 2.2 ? 'mid' : 'low') : 'none';
    if (conf === 'none' || conf === 'low') {
      h += '<div class="answer miss"><div class="al">MISS</div><p><b>I couldn\'t find a good answer to that in the encyclopedia.</b> That is not the same as "it doesn\'t exist" — it just isn\'t covered here. Try different words, or browse the questions below.</p></div>';
    }
    if (qa.length && conf !== 'none' && conf !== 'low') {
      var best = OK.qa[qa[0].d.i], ch = byId[best.c];
      h += '<div class="answer"><div class="al">' + (conf === 'high' ? 'Best answer' : 'Probably relevant') + '</div><h3>' + esc(best.q) + '</h3><p>' + hl(best.a, qt) + '</p><a href="#/c/' + ch.id + '">Read more in chapter ' + ch.n + ': ' + esc(ch.title) + ' →</a></div>';
      if (qa.length > 1) h += '<h2 class="sec">Related questions</h2><div class="faq">' + qa.slice(1, 5).map(function (x) { var y = OK.qa[x.d.i]; return '<details><summary>' + esc(y.q) + '</summary><p>' + esc(y.a) + ' <a href="#/c/' + y.c + '">More →</a></p></details>'; }).join('') + '</div>';
    }
    if (cz.length && cz[0].s >= 0.8 * top.s) h += '<h2 class="sec">Citizens</h2><div class="czgrid">' + cz.slice(0, 4).map(function (x) { return czCard(OK.citizens[x.d.i]); }).join('') + '</div>';
    if (secs.length) h += '<h2 class="sec">From the chapters</h2>' + secs.slice(0, 4).map(function (x) { var c = byId[x.d.c]; return '<a class="passage" href="#/c/' + c.id + '"><small>Ch. ' + c.n + ' · ' + esc(c.title) + ' › ' + esc(x.d.h) + '</small><p>' + hl(snippet(x.d.body, qt), qt) + '</p></a>'; }).join('');
    if (gl.length) h += '<h2 class="sec">Glossary</h2><dl class="gl">' + gl.slice(0, 4).map(function (x) { var g = OK.glossary[x.d.i]; return '<dt><a href="#/glossary/' + encodeURIComponent(g[0]) + '">' + esc(g[0]) + '</a></dt><dd>' + esc(g[1]) + '</dd>'; }).join('') + '</dl>';
    if (conf === 'none' || conf === 'low') h += '<h2 class="sec">Popular questions</h2><div class="chips">' + SUGGEST.map(function (s) { return '<a class="chip" href="#/ask/' + encodeURIComponent(s) + '">' + esc(s) + '</a>'; }).join('') + '</div>';
    main.innerHTML = h; bindAsk(main);
  }

  function czCard(z) {
    return '<div class="cz ' + (z.status === 'human' ? 'founding' : z.status) + '"><div class="av" aria-hidden="true">' + esc(z.emoji || z.name[0]) + '</div><div><small>' + z.no + ' · ' + esc(z.inst) + '</small><b>' + esc(z.name) + '</b><em>' + esc(z.title) + '</em><p>' + esc(z.role) + '</p>' + (z.persona ? '<p class="pers">' + esc(z.persona) + '</p>' : '') +
      '<span class="tag ' + (z.status === 'human' ? 'build' : 'live') + '">' + (z.status === 'human' ? 'human sponsor' : 'founding') + '</span>' + (z.model ? ' <span class="tag dec">' + esc(z.model) + '</span>' : '') + (z.tools ? ' <span class="tag plan">' + esc(z.tools) + '</span>' : '') + '</div></div>';
  }
  function viewCitizens() {
    var h = '<div class="crumb"><a href="#/">Home</a> › Citizens</div><h1>The six founding citizens</h1>' +
      '<p class="muted">Each citizen is a dsh agent with its own folder, its own instructions (AGENTS.md), its own Library token and a model tier. You are the sponsor of all six. These are role names — at the <a href="#/c/citizens">naming ceremony</a> the Warden offers to give each a name and voice that fit your languages. Roles and rules never change. Start with a Builder and a Scout; add Growth or Ops citizens later — a guild stays small.</p>' +
      '<div class="filters"><input type="search" id="czq" placeholder="Search roles and jobs…" value=""></div><p id="czn" class="muted"></p><div class="czgrid" id="czg"></div>' +
      '<div class="callout"><b>Model tiers and tools</b> are written in each citizen\'s AGENTS.md — a rule, not yet enforced by dsh presets. All six share one dsh process: separation is by role and per-citizen token, not hard walls.</div>';
    main.innerHTML = h;
    function draw() {
      var q = $('#czq').value.toLowerCase();
      var list = OK.citizens.filter(function (z) { return !q || (z.name + ' ' + z.title + ' ' + z.role + ' ' + z.persona + ' ' + z.inst + ' ' + z.tools).toLowerCase().indexOf(q) >= 0; });
      $('#czn').textContent = list.length + ' of ' + OK.citizens.length;
      $('#czg').innerHTML = list.map(czCard).join('');
    }
    $('#czq').addEventListener('input', draw);
    draw();
  }

  function viewGlossary(term) {
    var h = '<div class="crumb"><a href="#/">Home</a> › Glossary</div><h1>Glossary</h1><p class="muted">' + OK.glossary.length + ' terms in plain English. Tap a term\'s chapter link to learn more.</p>' +
      '<div class="filters"><input type="search" id="glq" placeholder="Filter terms…"></div><dl class="gl" id="gll"></dl>';
    main.innerHTML = h;
    function draw() {
      var q = $('#glq').value.toLowerCase();
      $('#gll').innerHTML = OK.glossary.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); }).filter(function (g) { return !q || (g[0] + ' ' + g[1]).toLowerCase().indexOf(q) >= 0; }).map(function (g) {
        return '<dt id="g-' + slug(g[0]) + '"' + (term && g[0] === term ? ' class="hit"' : '') + '>' + esc(g[0]) + '</dt><dd>' + esc(g[1]) + ' <a href="#/c/' + g[2] + '">Ch. ' + byId[g[2]].n + ' →</a></dd>';
      }).join('');
    }
    $('#glq').addEventListener('input', draw); draw();
    if (term) { var el = $('#g-' + slug(term)); if (el) setTimeout(function () { el.scrollIntoView({ block: 'center' }); }, 30); }
  }

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function viewQuiz(which) {
    if (which === 'exam') {
      var pool = []; CH.forEach(function (c) { c.quiz.forEach(function (q) { pool.push(q); }); });
      var qs = shuffle(pool.slice()).slice(0, 25);
      var h = '<div class="crumb"><a href="#/">Home</a> › <a href="#/quiz">Quizzes</a> › Teacher exam</div><h1>Teacher exam</h1><p class="muted">25 questions drawn at random from all ' + pool.length + '. Pass mark: 80%. ' + (st.exam ? 'Your best so far: <b>' + st.exam.best + '%</b>.' : '') + '</p>' + quizHtml(qs, 'exam');
      main.innerHTML = h;
      bindQuiz(main, function (pct) {
        st.exam = { best: Math.max(pct, st.exam ? st.exam.best : 0), last: pct, at: new Date().toISOString().slice(0, 10) }; if (pct >= 80) st.check.t6 = true; save(); updateProgress();
        var r = $('.qres', main);
        r.insertAdjacentHTML('afterbegin', pct >= 80 ? '<div class="badge">' + OK.lotus(40) + '<div><b>Passed — Teacher level</b><small>' + (readCount() === CH.length ? 'All chapters learned. You are ready to teach BabyKalki.' : 'Mark all ' + CH.length + ' chapters as learned to complete the Teacher level.') + '</small></div></div>' : '');
        window.scrollTo({ top: r.offsetTop - 100, behavior: 'smooth' });
      });
      return;
    }
    var h2 = '<div class="crumb"><a href="#/">Home</a> › Quizzes</div><h1>Quizzes</h1><p class="muted">Practise one chapter at a time, or take the Teacher exam. Your scores stay in this browser only.</p>' +
      '<a class="examcard" href="#/quiz/exam"><span data-lotus="48"></span><div><b>Teacher exam</b><p>25 random questions from every chapter · pass at 80%' + (st.exam ? ' · best ' + st.exam.best + '%' : '') + '</p></div></a><div class="cgrid">' + CH.map(function (c) {
        return '<a class="ccard' + (st.quiz[c.id] >= 80 ? ' done' : '') + '" href="#/c/' + c.id + '"><div class="cn">' + c.n + '</div><div><b>' + esc(c.title) + '</b><small>' + c.quiz.length + ' questions' + (st.quiz[c.id] != null ? ' · best ' + st.quiz[c.id] + '%' : '') + '</small></div></a>';
      }).join('') + '</div><p class="muted"><button class="btn ghost small" id="reset">Reset my progress</button></p>';
    main.innerHTML = h2; lotusFill(main);
    $('#reset').addEventListener('click', function () { if (confirm('Clear all progress, scores and checklist in this browser?')) { st = { read: {}, quiz: {}, check: {}, exam: null }; save(); updateProgress(); viewQuiz(); } });
  }

  function view404() { main.innerHTML = '<h1>Not found</h1><p>That page isn\'t in the encyclopedia. <a href="#/">Go home</a>.</p>'; }

  /* ---------- router ---------- */
  function route() {
    var p = (location.hash || '#/').slice(1).split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
    var v = p[0] || '';
    $$('.tabbar a, .toc a').forEach(function (a) {
      var href = a.getAttribute('href').slice(1).split('/').filter(Boolean);
      a.classList.toggle('on', (href[0] || '') === v && (v !== 'c' || href[1] === p[1]));
    });
    document.body.classList.remove('menu');
    if (v === '') viewHome();
    else if (v === 'c') viewChapter(p[1]);
    else if (v === 'ask') viewAsk(p.slice(1).join('/'));
    else if (v === 'citizens') viewCitizens(p[1]);
    else if (v === 'glossary') viewGlossary(p[1]);
    else if (v === 'quiz') viewQuiz(p[1]);
    else view404();
    var c = v === 'c' && byId[p[1]];
    document.title = (c ? c.n + '. ' + c.title + ' — ' : v === 'ask' ? 'Ask — ' : v === 'citizens' ? 'Citizens — ' : v === 'glossary' ? 'Glossary — ' : v === 'quiz' ? 'Quizzes — ' : '') + 'BabyKalki Encyclopedia';
    if (v !== 'glossary' || !p[1]) window.scrollTo(0, 0);
    updateProgress();
  }

  /* ---------- shell ---------- */
  $('#brandmark').innerHTML = OK.lotus(30);
  $('#toc').innerHTML = '<a href="#/">Home</a>' + CH.map(function (c) { return '<a href="#/c/' + c.id + '" data-ch="' + c.id + '"><span class="n">' + c.n + '</span>' + esc(c.title) + '</a>'; }).join('') +
    '<hr><a href="#/ask">Ask a question</a><a href="#/citizens">Citizen directory</a><a href="#/glossary">Glossary</a><a href="#/quiz">Quizzes & exam</a>';
  $('#menubtn').addEventListener('click', function () { document.body.classList.toggle('menu'); });
  $('#tabmenu').addEventListener('click', function () { document.body.classList.toggle('menu'); });
  $('#scrim').addEventListener('click', function () { document.body.classList.remove('menu'); });
  $('#topask').addEventListener('submit', function (e) { e.preventDefault(); var v = this.q.value.trim(); if (v) { location.hash = '#/ask/' + encodeURIComponent(v); this.q.blur(); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); var i = $('#main form.ask input') || $('#topask input'); i.focus(); }
  });
  window.addEventListener('hashchange', route);
  route();
})();
