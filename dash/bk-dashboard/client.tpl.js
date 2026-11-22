window.__ModuleLoader__.load({id:`@babykalki/dsh-dashboard`,factory:require=>{var module={exports:{}};var exports=module.exports;Object.defineProperty(exports,Symbol.toStringTag,{value:`Module`});
// client.tpl.js — browser half of the BabyKalki dashboard plugin for the dsh web UI (v0.7, 20 Nov 2026). MIT licence.
// Hand-written in dsh's own browser-module format (no build step): window.__ModuleLoader__.load({id, factory}).
// bk_dash.py fills in the data below at every start (names from the self cards, already sanitised; links from your
// settings) and writes the result to /run/bk/dash/bk-dashboard/client.js. Plain React.createElement, no other imports.
// What it adds (slots verified on dsh 0.2.2-rc.3): the sidebar brand, a "BabyKalki" sidebar panel (the six citizens,
// approvals, status, Library, slash commands), citizen buttons on the empty home, citizen workspaces named after the
// citizens, and "BabyKalki" in the browser tab. On load it opens a session with the Warden (or the citizen you last picked
// here) when dsh would otherwise show "Choose a workspace to start". It sends nothing anywhere; the only thing it stores is
// the role of the last citizen you picked, in this browser (localStorage "babykalki.lastCitizen").
const React = require("react");
const h = React.createElement;
const BK = /*@@BK_DATA@@*/{"product":"BabyKalki","version":"dev","citizens":[],"links":{},"commands":[],"lotus":"","startedAt":""};

const S = {
  page: {maxWidth: 980, margin: "0 auto", padding: "28px 28px 60px", fontSize: 14, lineHeight: 1.5, color: "inherit", overflowY: "auto", height: "100%", boxSizing: "border-box"},
  h1: {fontSize: 22, fontWeight: 650, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10},
  sub: {opacity: .7, margin: "0 0 22px"},
  h2: {fontSize: 15, fontWeight: 650, margin: "26px 0 10px"},
  grid: {display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12},
  card: {border: "1px solid rgba(127,127,127,.28)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6},
  name: {fontWeight: 650, fontSize: 15},
  role: {fontSize: 12, textTransform: "uppercase", letterSpacing: ".04em", opacity: .6},
  btn: {alignSelf: "flex-start", marginTop: 4, border: "1px solid #4B3FD6", background: "#4B3FD6", color: "#fff", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, textDecoration: "none", display: "inline-block"},
  ghost: {border: "1px solid rgba(127,127,127,.4)", background: "transparent", color: "inherit", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, textDecoration: "none", display: "inline-block"},
  row: {display: "flex", flexWrap: "wrap", gap: 8},
  code: {fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, background: "rgba(127,127,127,.12)", borderRadius: 6, padding: "1px 6px"},
  chip: {border: "1px solid rgba(127,127,127,.35)", background: "transparent", color: "inherit", borderRadius: 999, padding: "4px 12px", cursor: "pointer", fontSize: 13},
  note: {fontSize: 12.5, opacity: .7},
};

function Lotus({size}) {
  const s = size || 24;
  return h("span", {"aria-hidden": "true", style: {display: "inline-flex", width: s, height: s, flex: "none"},
    dangerouslySetInnerHTML: {__html: BK.lotus}});
}
function BrandName() { return h("span", {style: {fontWeight: 650, fontSize: 15, letterSpacing: ".01em"}}, BK.product); }
function PanelIcon({size}) { return h(Lotus, {size: size || 16}); }

function link(href, label, ghost) {
  if (!href) return null;
  return h("a", {href, target: "_blank", rel: "noopener noreferrer", style: ghost === false ? S.btn : S.ghost}, label);
}

// ---- citizens → workspaces + sessions
const TITLES = new Set(BK.citizens.map(c => c.title));
function shouldRename(title, c) {
  // Rename only titles dsh or BabyKalki gave (folder name "work", a bare role, "<old name> · <Role>") — never the founder's own.
  if (!title || title === c.display) return false;
  if (title === "work" || TITLES.has(title)) return true;
  const i = title.lastIndexOf(" · ");
  return i > 0 && title.slice(i + 3) === c.title;
}
async function citizenWorkspace(ctx, c) {
  const ws = ctx.get("workspaces");
  if (!ws || !c.path) return undefined;
  const v = await ws.create({path: c.path});
  if (shouldRename(v.title, c)) { try { await ws.rename(v.workspaceId, c.display); } catch (e) { console.warn("babykalki: rename", e); } }
  return v.workspaceId;
}
const LAST = "babykalki.lastCitizen";
function remember(c) { try { window.localStorage.setItem(LAST, c.role); } catch (e) { /* private mode: fine */ } }
function preferred() {
  let r = "";
  try { r = window.localStorage.getItem(LAST) || ""; } catch (e) { /* ignore */ }
  return BK.citizens.find(c => c.role === r) || BK.citizens.find(c => c.isDefault) || BK.citizens[0];
}
async function talk(ctx, c) {
  remember(c);
  let id;
  try { id = await citizenWorkspace(ctx, c); } catch (e) { console.warn("babykalki: workspace for " + c.role, e); }
  const ui = ctx.get("uiWorkspace");
  if (ui) ui.startSession(id, c.preset ? {agentPreset: c.preset} : undefined);
}

// ---- R2-06: never leave the founder on dsh's "Choose a workspace to start" (no session → the composer is disabled).
// dsh itself reopens the last session / most recent workspace; only when it found nothing (first visit, everything
// archived) we open a blank session with the preferred citizen. A blank session dsh reopened in a citizen's workspace but
// under another citizen's mode (dsh's default is the Warden) is switched to the citizen that owns the workspace.
function mainSession(ctx) {
  const s = ctx.get("sessions");
  const snap = s && s.list && typeof s.list.getSnapshot === "function" ? s.list.getSnapshot() : undefined;
  if (!snap || !snap.byId) return undefined;
  return Object.values(snap.byId).find(r => r && r.retainedBy && (r.retainedBy.mainView || 0) > 0) || null;
}
const pause = ms => new Promise(r => setTimeout(r, ms));
async function openReady(ctx, tries, every) {
  for (let i = 0; i < tries; i++) {
    const m = mainSession(ctx);
    if (m === undefined) return "no-api";                   // a dsh without this API: leave dsh's own behaviour
    if (m) {
      const owner = m.blank ? BK.citizens.find(c => c.path && c.path === m.cwd) : undefined;
      const listed = m.projectionValues && m.projectionValues.agentPreset;
      if (owner && owner.preset && typeof listed === "string" && listed !== owner.preset) { await talk(ctx, owner); return "fixed:" + owner.role; }
      return "kept";
    }
    await pause(every);
  }
  const c = preferred();
  if (!c) return "none";
  await talk(ctx, c);
  return "opened:" + c.role;
}

function CitizenCards({ctx}) {
  return h("div", {style: S.grid}, BK.citizens.map(c => h("div", {key: c.role, style: S.card},
    h("div", {style: S.role}, c.title + (c.isDefault ? " · default" : "")),
    h("div", {style: S.name}, c.name || c.title),
    h("div", {style: {opacity: .8}}, c.blurb),
    h("button", {type: "button", style: S.btn, onClick: () => talk(ctx, c)}, "New session with " + (c.name || "the " + c.title)))));
}

function Panel({ctx}) {
  const L = BK.links || {};
  return h("div", {style: S.page},
    h("h1", {style: S.h1}, h(Lotus, {size: 30}), BK.product),
    h("p", {style: S.sub}, "Your company of six citizens. Pick who you talk to; the Warden is the front desk and the default. " +
      "Kit " + BK.version + (started() ? " · started " + started() : "") + "."),
    h("h2", {style: S.h2}, "Citizens"),
    h(CitizenCards, {ctx}),
    h("p", {style: S.note}, "Each citizen has its own workspace in the left sidebar (sessions are grouped under its name) and its own mode in the " +
      "mode menu above the message box. Names come from the self cards written in the naming ceremony; a new name shows after the next restart."),
    h("h2", {style: S.h2}, "Approvals — only you decide"),
    h("p", null, "Citizens can only ASK. Anything that leaves the company (mail, posts, payments, merges) needs your button press on the approvals page. A \"yes\" in chat is not a decision."),
    h("div", {style: S.row}, link(L.approve, "Open approvals (/bk-approve)", false)),
    h("h2", {style: S.h2}, "Connections — every key and account"),
    h("p", null, "The Connections Register (/data/registers/connections-register.yml, kept in the Library by the Steward) lists every key " +
      "and account the company uses: owner, narrowest scope, green / amber / red, spend against cap, expiry. To see it, type ",
      h("span", {style: S.code}, "/connections"), " in any citizen's session (or ask the Steward). Only the Steward changes it; keys themselves are never shown."),
    h("h2", {style: S.h2}, "Status, Library and the Librarian round"),
    h("p", null, "The Library is the company's memory: citizens propose facts, the Librarian round commits them (in the background, every " +
      (BK.roundEvery || 10) + " minutes). Tasks live in the Library too. The status page shows counts and states — no private text."),
    h("div", {style: S.row}, link(L.status, "Status page"), link(L.guide, "Founder's guide"), link(L.community, "Community")),
    h("h2", {style: S.h2}, "Slash commands (type / in the message box)"),
    h("div", {style: {display: "grid", gridTemplateColumns: "max-content 1fr", gap: "6px 14px"}},
      BK.commands.flatMap(cmd => [h("span", {key: cmd.name + "-n", style: S.code}, "/" + cmd.name), h("span", {key: cmd.name + "-d"}, cmd.description)])),
    h("h2", {style: S.h2}, "Good to know"),
    h("ul", {style: {margin: 0, paddingLeft: 18}},
      h("li", null, "Stop everything: create the file /data/STOP (or ask the Steward). The status page says STOPPED."),
      h("li", null, "This page is BabyKalki's own; the rest of the screen is the DeepSeek Harness (dsh) web UI with its DeepSeek parts switched off."),
      h("li", null, "Change any of it in /data/dsh/cordis.founder.yml (see the guide, \"Your dashboard\").")));
}

// When BabyKalki (re)started dsh — an update or a restart. Shown in the panel; on the home page for the first hour.
function started(withDay) {
  const t = Date.parse(BK.startedAt || "");
  if (!(t > 0)) return "";
  const d = new Date(t), iso = d.toISOString();
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return (withDay === false ? "" : d.getUTCDate() + " " + mon + " ") + iso.slice(11, 16) + " UTC";
}
function recentRestart(now) {
  const t = Date.parse(BK.startedAt || "");
  return t > 0 && (now || Date.now()) - t < 3600e3;
}

function HomeCitizens({ctx}) {
  return h("div", {style: {display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "auto", maxWidth: 720, padding: "0 16px"}},
    recentRestart() ? h("div", {style: {...S.note, opacity: .85, textAlign: "center"}}, "BabyKalki restarted at " + started(false) +
      " (an update or a restart). Your sessions are kept; if a reply was cut off, send your message again.") : null,
    h("div", {style: S.note}, "Type above to talk to the citizen in the mode menu, or start with another:"),
    h("div", {style: {...S.row, justifyContent: "center"}}, BK.citizens.map(c => h("button", {key: c.role, type: "button", style: S.chip,
      title: c.blurb, onClick: () => talk(ctx, c)}, c.display))),
    h("div", {style: {...S.note, display: "flex", gap: 14}},
      BK.links.approve ? h("a", {href: BK.links.approve, target: "_blank", rel: "noopener noreferrer", style: {color: "inherit"}}, "Approvals") : null,
      BK.links.status ? h("a", {href: BK.links.status, target: "_blank", rel: "noopener noreferrer", style: {color: "inherit"}}, "Status") : null,
      h("span", null, "More: the BabyKalki panel, top left")));
}

const HEADLINE = {"Into the Unknown": "Who do you want to talk to?"};
function useHeadline(ref, on) {
  // dsh's English home headline is a fixed string (no setting): replace just that text node and hide the 'Preview' pill,
  // only inside the empty home. Other languages keep dsh's own text.
  React.useEffect(() => {
    const root = on && ref.current && ref.current.parentElement;
    if (!root) return undefined;
    const fix = () => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const r = HEADLINE[n.nodeValue];
        if (r) n.nodeValue = r;
        else if (n.nodeValue === "Preview" && n.parentElement && n.parentElement.childNodes.length === 1) n.parentElement.style.display = "none";
      }
    };
    fix();
    const obs = new MutationObserver(fix);
    obs.observe(root, {subtree: true, childList: true, characterData: true});
    return () => obs.disconnect();
  }, [on]);
}
function makeHeroFrame(ctx) {
  return function BabyKalkiHome({hero, children}) {
    const ref = React.useRef(null);
    useHeadline(ref, hero);
    return h(React.Fragment, null, h("span", {ref, hidden: true}), children, hero ? h("div", {style: {position: "absolute", left: 0, right: 0, bottom: 28,
      display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 1}}, h(HomeCitizens, {ctx})) : null);
  };
}

function retitle() {
  const t = document.title;
  if (t.indexOf("DeepSeek Harness") >= 0) document.title = t.split("DeepSeek Harness").join(BK.product);
  if (BK.lotus) {
    let icon = document.querySelector("link[rel~='icon']");
    const href = "data:image/svg+xml," + encodeURIComponent(BK.lotus);
    if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); }
    if (icon.getAttribute("href") !== href) icon.setAttribute("href", href);
  }
}

const PANEL_ID = "babykalki";
const inject = ["slots"];
function apply(ctx) {
  ctx.slots.inject("sidebar.brand.mark", () => ctx.slots.inject("sidebar.brand.name", function* () {
    yield ctx.slots.register({name: "sidebar.brand.mark"}, Lotus);
    yield ctx.slots.register({name: "sidebar.brand.name"}, BrandName);
  }));
  ctx.slots.inject("conversation.hero.brand.mark", () => ctx.slots.register({name: "conversation.hero.brand.mark"}, Lotus));
  if (BK.citizens.length) {
    ctx.slots.inject("conversation.hero.frame", () => ctx.slots.register({name: "conversation.hero.frame", id: "babykalki-home"}, makeHeroFrame(ctx)));
  }
  ctx.slots.inject("main", () => ctx.slots.inject("sidebar.panellist", function* () {
    yield ctx.slots.register({name: "main", key: PANEL_ID}, function BabyKalkiPanel() { return h(Panel, {ctx}); });
    yield ctx.slots.register({name: "sidebar.panellist", id: PANEL_ID, order: 1, label: () => BK.product}, PanelIcon);
  }));
  // The browser tab says BabyKalki (dsh sets "<session> — DeepSeek Harness"); a favicon lotus. Page-local only.
  retitle();
  const obs = new MutationObserver(retitle);
  obs.observe(document.head, {subtree: true, childList: true, characterData: true});
  ctx.on("dispose", () => obs.disconnect());
  // Citizen workspaces: create once per page load (idempotent on the server; newest is listed first, so the Warden is created
  // last and sits on top); titles follow the self cards.
  // Then make sure the home page is ready to type (R2-06).
  setTimeout(async () => {
    for (const c of BK.citizens.slice().reverse()) { try { await citizenWorkspace(ctx, c); } catch (e) { console.warn("babykalki: workspace " + c.role, e); } }
    try { await openReady(ctx, 5, 400); } catch (e) { console.warn("babykalki: open the Warden", e); }
  }, 1500);
}
exports.apply = apply; exports.inject = inject; return module.exports}});
