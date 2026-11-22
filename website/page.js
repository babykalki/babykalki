(function(){
  "use strict";
  var LS = (function(){ try{ var k='bk-v02-t'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return localStorage; }catch(_){ return null; } })();
  function lsGet(k){ try{ return LS ? LS.getItem(k) : null; }catch(_){ return null; } }
  function lsSet(k,v){ try{ if(LS){ if(v===null) LS.removeItem(k); else LS.setItem(k,v); } }catch(_){} }
  function $(s,r){ return (r||document).querySelector(s); }
  function $$(s,r){ return [].slice.call((r||document).querySelectorAll(s)); }

  /* ---------- copy buttons (paste blocks copy the filled text) ---------- */
  function textOf(btn){
    var box = btn.closest('.paste,.code'); if(!box) return '';
    var pre = box.querySelector('pre'); return pre ? pre.textContent : '';
  }
  function flash(btn, ok){
    var t = btn.getAttribute('data-label') || btn.textContent; btn.setAttribute('data-label', t);
    btn.textContent = ok ? 'Copied ✓' : 'Select & copy'; btn.classList.toggle('done', ok);
    setTimeout(function(){ btn.textContent = t; btn.classList.remove('done'); }, 1600);
  }
  function fallback(btn, txt){
    var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly','');
    ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.left = '0'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus({preventScroll:true}); ta.select();
    var ok = false; try{ ok = document.execCommand('copy'); }catch(_){}
    document.body.removeChild(ta); btn.focus({preventScroll:true}); flash(btn, ok);
  }
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('button.copy'); if(!btn) return;
    var txt = textOf(btn); window.__bkLastCopy = txt;
    if(navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(txt).then(function(){ flash(btn, true); }, function(){ fallback(btn, txt); });
    } else { fallback(btn, txt); }
  });

  /* ---------- Your details -> placeholder substitution in mission prompts ---------- */
  var form = $('#details');
  if(form) form.addEventListener('submit', function(e){ e.preventDefault(); });   // v0.6: was an inline onsubmit (blocked by the site's CSP)
  var FIELDS = ['brand','domain','email','n','platforms','repo','city','language'];
  var TOKENS = [ // [placeholder text, field]
    ['[brand]','brand'], ['[domain]','domain'], ['MYDOMAIN','domain'], ['yourdomain','domain'],
    ['[N]','n'], ['[platforms]','platforms'], ['[repo]','repo'], ['[email]','email'],
    ['[city]','city'], ['[language]','language']
  ];
  function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function loadDetails(){ try{ return JSON.parse(lsGet('bk-v02-details') || '{}') || {}; }catch(_){ return {}; } }
  var pastes = $$('.paste');
  pastes.forEach(function(p){
    var pre = p.querySelector('pre'); if(!pre) return;
    pre.setAttribute('data-orig', pre.textContent);
    var note = document.createElement('div'); note.className = 'fillnote';
    note.textContent = '✓ filled from Your details'; p.appendChild(note);
  });
  function render(d){
    var active = TOKENS.filter(function(t){ return d[t[1]] && String(d[t[1]]).trim(); });
    var re = active.length ? new RegExp(active.map(function(t){ return esc(t[0]); }).join('|'), 'g') : null;
    var lookup = {}; active.forEach(function(t){ lookup[t[0]] = String(d[t[1]]).trim(); });
    pastes.forEach(function(p){
      var pre = p.querySelector('pre'); if(!pre) return;
      var orig = pre.getAttribute('data-orig'); var hit = false;
      pre.textContent = '';
      if(!re){ pre.textContent = orig; p.classList.remove('filled'); return; }
      var last = 0; re.lastIndex = 0; var m;
      while((m = re.exec(orig))){
        if(m.index > last) pre.appendChild(document.createTextNode(orig.slice(last, m.index)));
        var mk = document.createElement('mark'); mk.textContent = lookup[m[0]]; mk.title = 'from Your details (' + m[0] + ')';
        pre.appendChild(mk); last = m.index + m[0].length; hit = true;
      }
      if(last < orig.length) pre.appendChild(document.createTextNode(orig.slice(last)));
      p.classList.toggle('filled', hit);
    });
  }
  function readForm(){ var d = {}; FIELDS.forEach(function(f){ var el = form.elements[f]; if(el && el.value.trim()) d[f] = el.value.trim(); }); return d; }
  function stateMsg(d){
    var st = $('#details-state'); if(!st) return;
    var n = Object.keys(d).length;
    st.textContent = n ? (n + ' of ' + FIELDS.length + ' filled · saved in this browser' + (LS ? '' : ' (storage unavailable — kept until you leave the page)')) : '';
  }
  if(form){
    var d0 = loadDetails();
    FIELDS.forEach(function(f){ if(d0[f] && form.elements[f]) form.elements[f].value = d0[f]; });
    render(d0); stateMsg(d0);
    form.addEventListener('input', function(){ var d = readForm(); lsSet('bk-v02-details', JSON.stringify(d)); render(d); stateMsg(d); });
    var clr = $('#details-clear');
    if(clr) clr.addEventListener('click', function(){ FIELDS.forEach(function(f){ if(form.elements[f]) form.elements[f].value=''; }); lsSet('bk-v02-details', null); render({}); stateMsg({}); });
  }

  /* ---------- per-level Done checkboxes ---------- */
  var boxes = $$('input[data-level]');
  function progress(){
    var n = boxes.filter(function(b){ return b.checked; }).length;
    var t = $('#progress-text'); if(t) t.innerHTML = '<b>' + n + ' of ' + boxes.length + '</b> Path A levels done';
    var bar = $('#progress-bar'); if(bar) bar.style.width = (boxes.length ? (100 * n / boxes.length) : 0) + '%';
  }
  boxes.forEach(function(b){
    var key = 'bk-v02-done-' + b.getAttribute('data-level');
    b.checked = lsGet(key) === '1';
    var lv = b.closest('.level'); if(lv) lv.classList.toggle('isdone', b.checked);
    b.addEventListener('change', function(){
      lsSet(key, b.checked ? '1' : null);
      if(lv) lv.classList.toggle('isdone', b.checked);
      progress();
    });
  });
  progress();

  /* ---------- grouped nav: highlight group + section; horizontal scrollTo only ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var groupLinks = $$('#groups a');
  var subnavs = $$('.subnav');
  var drawerLinks = $$('#drawer a');
  var current = null;
  function hscroll(container, el){
    if(!container || !el || container.scrollWidth <= container.clientWidth) return;
    var x = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
    x = Math.max(0, Math.min(x, container.scrollWidth - container.clientWidth));
    if(container.scrollTo) container.scrollTo({left: x, behavior: reduce ? 'auto' : 'smooth'}); else container.scrollLeft = x;
  }
  function setActive(id, g){
    if(id === current) return; current = id;
    groupLinks.forEach(function(a){ var on = a.getAttribute('data-g') === g; a.classList.toggle('on', on); if(on) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
    subnavs.forEach(function(s){ s.classList.toggle('on', s.getAttribute('data-g') === g); });
    var activeLink = null;
    $$('.subnav a').forEach(function(a){ var on = a.getAttribute('href') === '#' + id; a.classList.toggle('on', on); if(on){ a.setAttribute('aria-current','location'); activeLink = a; } else a.removeAttribute('aria-current'); });
    drawerLinks.forEach(function(a){ a.classList.toggle('on', a.getAttribute('href') === '#' + id); });
    if(activeLink) hscroll(activeLink.parentNode, activeLink);
  }
  var tracked = $$('main section[id]');
  var foot = $('footer#licence'); if(foot){ foot.setAttribute('data-g','trust'); tracked.push(foot); }
  if('IntersectionObserver' in window && tracked.length){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(en){ if(en.isIntersecting) setActive(en.target.id, en.target.getAttribute('data-g') || 'start'); });
    }, {rootMargin: '-40% 0px -55% 0px'});
    tracked.forEach(function(s){ io.observe(s); });
  }

  /* ---------- Contents drawer (phone) ---------- */
  var btn = $('#menu-btn'), drawer = $('#drawer'), bg = $('#drawer-bg'), closeBtn = $('#drawer-close');
  function focusables(){ return $$('a[href],button', drawer).filter(function(el){ return el.offsetParent !== null; }); }
  function openDrawer(){
    drawer.hidden = false; bg.hidden = false; btn.setAttribute('aria-expanded','true');
    var on = $('#drawer a.on'); (closeBtn || drawer).focus({preventScroll:true});
    if(on) drawer.scrollTop = Math.max(0, on.offsetTop - 120);
  }
  function closeDrawer(restore){
    if(drawer.hidden) return;
    drawer.hidden = true; bg.hidden = true; btn.setAttribute('aria-expanded','false');
    if(restore) btn.focus({preventScroll:true});
  }
  if(btn && drawer && bg){
    btn.addEventListener('click', function(){ if(drawer.hidden) openDrawer(); else closeDrawer(true); });
    bg.addEventListener('click', function(){ closeDrawer(true); });
    if(closeBtn) closeBtn.addEventListener('click', function(){ closeDrawer(true); });
    drawer.addEventListener('click', function(e){ var a = e.target.closest('a[href^="#"]'); if(a) closeDrawer(false); });
    document.addEventListener('keydown', function(e){
      if(drawer.hidden) return;
      if(e.key === 'Escape'){ e.preventDefault(); closeDrawer(true); return; }
      if(e.key === 'Tab'){
        var f = focusables(); if(!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if(e.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))){ e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function(){ if(window.innerWidth >= 600) closeDrawer(false); });
  }

  /* ---------- open a <details> when its anchor is followed ---------- */
  function openHash(){
    var h = decodeURIComponent(location.hash.slice(1)); if(!h) return;
    var el = document.getElementById(h);
    if(el && el.tagName === 'DETAILS') el.open = true;  // opening expands downwards, so the scroll position stays put
  }
  window.addEventListener('hashchange', openHash); openHash();
})();
