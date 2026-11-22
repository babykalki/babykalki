"""v0.7: the private dashboard — bk_dash.py (browser plugin + slash commands), the dashboard rows in cordis.patch.yml and
bk_presets.py, and the supervisor wiring. The look and the slots were checked against the real dsh 0.2.2-rc.3 web UI with
headless Chromium (DASHBOARD-DOCS.md, screenshots in dash-shots/); here we make sure the generated config and code are
what we shipped, that nothing a citizen writes reaches the browser code except a sanitised name, and that a broken
dashboard can never stop dsh from starting."""
import json, os, re, shutil, subprocess
import pytest
from conftest import FILES
import bk_dash as B
import bk_presets as P
import bk_supervisor as S

TPL_JS = open(os.path.join(FILES, "dash", "bk-dashboard", "client.tpl.js")).read()
SKILLS = os.path.join(FILES, "dash", "skills")
CARDS = {"warden": "# Self card\n- My name is Alfred; I keep the door (F-1)\n",
         "scout": '- My name is "</script><img src=x onerror=alert(1)>',
         "librarian": "- my name is Edith Rani and I am the librarian"}


def blob(js):
    m = re.search(r"/\*BK_DATA\*/(\{.*?\});\n", js)
    assert m, "no data in client.js"
    return json.loads(m.group(1))


def test_names_from_cards_roles_presets_and_default():
    d = B.data(CARDS, {}, skills_dir=SKILLS, version=S.VERSION)
    c = {x["role"]: x for x in d["citizens"]}
    assert [x["role"] for x in d["citizens"]] == list(P.CITIZENS)
    assert c["warden"]["display"] == "Alfred · Warden" and c["warden"]["name"] == "Alfred" and c["warden"]["isDefault"]
    assert c["librarian"]["display"] == "Edith Rani · Librarian"
    assert c["scout"]["display"] == "Scout" and c["scout"]["name"] == ""          # hostile card → plain role title
    assert all(x["preset"] == f"bk-{x['role']}" and x["path"] == f"/data/citizens/{x['role']}/work" for x in d["citizens"])
    assert sum(x["isDefault"] for x in d["citizens"]) == 1
    assert all(x["preset"] == "" for x in B.data({}, {}, presets_on=False)["citizens"])   # presets off: no preset ids


def test_client_js_has_exactly_the_data_and_no_html_breakout():
    js = B.render_client(TPL_JS, B.data(CARDS, {}, skills_dir=SKILLS, version=S.VERSION))
    assert "@@BK_DATA@@" not in js and js.count("/*BK_DATA*/") == 1
    assert "</" not in js.split("/*BK_DATA*/", 1)[1].split(";\n", 1)[0]
    assert all(ord(ch) < 128 for ch in js.split("/*BK_DATA*/", 1)[1].split(";\n", 1)[0])
    assert blob(js)["citizens"][0]["display"] == "Alfred · Warden"
    with pytest.raises(ValueError):
        B.render_client("no marker", {})
    with pytest.raises(ValueError):
        B.render_client(TPL_JS + "\n/*@@BK_DATA@@*/{};\n", {})


@pytest.mark.parametrize("u,ok", [("https://bk.openkalki.org/status/", True), ("/bk-approve", True),
                                  ("javascript:alert(1)", False), ("http://x.org/", False), ("https://x.org/\"><b>", False),
                                  ("", False), ("data:text/html,x", False), ("//evil.example/", False)])
def test_only_https_or_same_site_links_reach_the_page(u, ok):
    assert (B.safe_url(u) == u and u != "") is ok and (ok or B.safe_url(u) == "")


def test_links_from_settings():
    assert B.links({"BK_DOMAIN": "mystartup.com"}) == {"approve": "/bk-approve", "status": "https://www.mystartup.com/status/",
                                                      "guide": B.DEFAULT_GUIDE, "community": ""}
    assert B.links({"BK_DOMAIN": "mystartup.com"}, www_has_index=False)["status"] == "https://www.mystartup.com/"
    l = B.links({"BK_STATUS_URL": "https://bk.openkalki.org/status/", "BK_GUIDE_URL": "javascript:x"})
    assert l["status"] == "https://bk.openkalki.org/status/" and l["guide"] == ""
    assert B.links({})["status"] == ""


def test_shipped_slash_commands_are_user_only_skills():
    cmds = B.commands(SKILLS)
    names = [c["name"] for c in cmds]
    assert names == sorted(["brief", "tasks", "approve-requests", "connections", "remember", "handoff", "whoami"])
    for n in names:
        t = open(os.path.join(SKILLS, n, "SKILL.md")).read()
        head = t.split("---")[1]
        assert re.search(rf"^name: {re.escape(n)}$", head, re.M)
        assert re.search(r"^disable-model-invocation: true$", head, re.M)    # only the founder starts them
        assert re.search(r'^description: "BabyKalki: ', head, re.M)
        assert "/bk-approve" in t or n not in ("brief", "approve-requests")
    assert all(c["description"] and not c["description"].startswith("BabyKalki") for c in cmds)


def test_install_plugin_row_and_skills(tmp_path):
    d = B.data(CARDS, {}, skills_dir=SKILLS)
    pkg = B.install_plugin(os.path.join(FILES, "dash"), str(tmp_path / "dash"), d)
    assert sorted(os.listdir(pkg)) == ["client.js", "index.mjs", "package.json"]
    man = json.load(open(os.path.join(pkg, "package.json")))
    assert man["dsh"]["client"]["platform"] == "web" and man["exports"]["./client"] == "./client.js"
    assert man["exports"]["."] == "./index.mjs" and man["main"] == "index.mjs"
    assert oct(os.stat(pkg).st_mode & 0o777) == "0o755" and oct(os.stat(os.path.join(pkg, "client.js")).st_mode & 0o777) == "0o644"
    r = B.row(pkg)
    assert f"    - id: {B.ROW_ID}\n      name: {pkg}/index.mjs\n" in r and r.lstrip("\n").startswith("# 5b)")
    (tmp_path / "home" / "skills" / "mine").mkdir(parents=True)
    (tmp_path / "home" / "skills" / "mine" / "SKILL.md").write_text("founder's own")
    got = B.install_skills(SKILLS, str(tmp_path / "home" / "skills"))
    assert len(got) == 7 and (tmp_path / "home" / "skills" / "mine" / "SKILL.md").read_text() == "founder's own"
    B.remove_plugin(str(tmp_path / "dash"))
    assert not os.path.exists(pkg)


def test_client_js_runs_and_registers_the_dashboard_slots(tmp_path):
    """Execute the rendered browser module in node with stand-ins for dsh's module loader, React and the slot registry."""
    if not shutil.which("node"):
        pytest.skip("node not found")
    js = B.render_client(TPL_JS, B.data(CARDS, {"BK_STATUS_URL": "https://bk.openkalki.org/status/"}, skills_dir=SKILLS))
    (tmp_path / "client.js").write_text(js)
    harness = r"""
const regs = []; let mod;
const el = (t, p, ...c) => ({t, p, c});
const React = {createElement: el, Fragment: 'F', useRef: () => ({current: null}), useEffect: () => {}};
globalThis.window = {__ModuleLoader__: {load: ({id, factory}) => { mod = {id, exports: factory(n => n === 'react' ? React : (() => { throw new Error('unexpected require ' + n) })())}; }}};
globalThis.document = {title: 'x — DeepSeek Harness', head: {appendChild() {}}, querySelector: () => null,
  createElement: () => ({setAttribute() {}, getAttribute() {}})};
globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.setTimeout = () => 0;
require(process.argv[2]);
const ctx = {slots: {inject: (name, f) => { const r = f(); if (r && r.next) for (const _ of r) {} },
                     register: (meta, comp) => { regs.push([meta.name, meta.key || meta.id || '', typeof comp]); return () => {}; }},
             on() {}, get() {}};
mod.exports.apply(ctx);
console.log(JSON.stringify({id: mod.id, inject: mod.exports.inject, regs, title: document.title}));
"""
    (tmp_path / "h.cjs").write_text(harness)
    out = subprocess.run(["node", str(tmp_path / "h.cjs"), str(tmp_path / "client.js")], capture_output=True, text=True, timeout=30)
    assert out.returncode == 0, out.stderr
    r = json.loads(out.stdout)
    assert r["id"] == "@babykalki/dsh-dashboard" and r["inject"] == ["slots"] and r["title"] == "x — BabyKalki"
    names = [x[0] for x in r["regs"]]
    assert names == ["sidebar.brand.mark", "sidebar.brand.name", "conversation.hero.brand.mark", "conversation.hero.frame",
                     "main", "sidebar.panellist"]
    assert ["main", "babykalki", "function"] in r["regs"] and ["sidebar.panellist", "babykalki", "function"] in r["regs"]


DISABLED = ["ui-brand-official", "ui-settings-account", "ui-account-notifications", "message-feedback", "ui-message-feedback",
            "command-feedback", "ui-settings-session-log", "open-in-app", "ui-open-in-app", "entry-customization",
            "ui-plugin-manager", "llm-deepseek",
            # v0.5 privacy rows — the DeepSeek account/telemetry rows must stay off
            "session-telemetry-otel", "plugin-package-inventory-deepseek", "deepseek-account", "llm-deepseek-account",
            "web-search-deepseek", "desktop-product-telemetry", "product-analytics"]


def test_dashboard_rows_in_cordis_patch_no_deepseek_account_ui_enabled():
    t = open(os.path.join(FILES, "cordis.patch.yml")).read()
    for row in DISABLED:
        m = re.search(rf"^- id: {re.escape(row)}\b.*\n  (\S.*)$", t, re.M)
        assert m and m.group(1) == "disabled: true", (row, m and m.group(1))
    assert re.search(r"^- id: session-log-deepseek\b.*\n  config: \{ enabled: false \}$", t, re.M)
    assert not re.search(r"disabled: false", t.split("# Notes", 1)[0].replace("#          disabled: false", ""))


def test_presets_text_makes_warden_default_and_hides_dsh_modes():
    for m in ("1", "shared"):
        out = P.render(open(os.path.join(FILES, "cordis.citizens.tpl.yml")).read(), m, {})
        assert "- id: agent-preset-registry\n  config: { default: bk-warden }" in out
        for row in ("preset-standard", "preset-ptc", "preset-minimal", "preset-cordis"):
            assert f"- id: {row}\n  disabled: true" in out
    assert P.render("", "0", {}) == ""


def _sup(monkeypatch, tmp_path, env, presets_state="ON"):
    monkeypatch.setattr(S, "E", env); monkeypatch.setattr(S, "D", str(tmp_path / "data"))
    monkeypatch.setattr(S, "RUNTIME", str(tmp_path / "run"))
    (tmp_path / "data" / "citizens" / "warden").mkdir(parents=True, exist_ok=True)
    (tmp_path / "data" / "citizens" / "warden" / "AGENTS.local.md").write_text("- My name is Alfred\n")
    s = S.Supervisor.__new__(S.Supervisor)
    s.presets, s.dash = {"mode": "1", "state": presets_state}, {"state": "OFF", "skills": 0}

    class U:
        on = False
    s.users = U()
    s.lib_every_min = lambda: 10
    return s


def test_supervisor_writes_plugin_row_and_skills(monkeypatch, tmp_path):
    s = _sup(monkeypatch, tmp_path, {"BK_STATUS_URL": "https://bk.openkalki.org/status/"})
    row = s.dash_text()
    assert s.dash["state"] == "ON" and f"name: {tmp_path}/run/dash/bk-dashboard/index.mjs" in row
    d = blob(open(tmp_path / "run" / "dash" / "bk-dashboard" / "client.js").read())
    assert d["citizens"][0]["display"] == "Alfred · Warden" and d["links"]["status"] == "https://bk.openkalki.org/status/"
    assert d["version"] == S.VERSION and len(d["commands"]) == 7
    (tmp_path / "data" / "dsh").mkdir()
    s.dash_skills()
    assert s.dash["skills"] == 7 and (tmp_path / "data" / "dsh" / "skills" / "brief" / "SKILL.md").exists()


def test_supervisor_dashboard_off_fallback_and_errors_never_raise(monkeypatch, tmp_path):
    s = _sup(monkeypatch, tmp_path, {"BK_DASHBOARD": "0", "BK_DASH_SKILLS": "0"})
    assert s.dash_text() == "" and s.dash["state"] == "OFF"
    s.dash_skills(); assert s.dash["skills"] == 0
    s = _sup(monkeypatch, tmp_path, {}, presets_state="FALLBACK")
    assert s.dash_text() == "" and s.dash["state"] == "FALLBACK"
    s = _sup(monkeypatch, tmp_path, {})
    ship = tmp_path / "ship"; (ship / "dash" / "bk-dashboard").mkdir(parents=True)
    (ship / "dash" / "bk-dashboard" / "client.tpl.js").write_text("no marker")
    for n in ("package.json", "index.mjs"):
        (ship / "dash" / "bk-dashboard" / n).write_text("{}")
    monkeypatch.setattr(S, "SHIP", str(ship))
    assert s.dash_text() == "" and s.dash["state"] == "ERROR"          # a broken template: dashboard off, dsh still starts


def test_started_at_is_in_the_data_and_iso_utc():
    d = B.data(CARDS, {}, skills_dir=SKILLS, version=S.VERSION)
    assert re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", d["startedAt"])
    assert B.data({}, {}, started_at="2026-11-20T06:54:00Z")["startedAt"] == "2026-11-20T06:54:00Z"


def test_librarian_round_prompt_names_this_version_and_optional_local_file():
    assert f"(BabyKalki {S.VERSION})" in S.LIBRARIAN_PROMPT and "v0.5" not in S.LIBRARIAN_PROMPT
    assert "AGENTS.local.md (if it exists)" in S.LIBRARIAN_PROMPT


OPEN_HARNESS = r"""
// R2-06: the home page must never stay on "Choose a workspace to start". Stand-ins for dsh's workspaces / sessions /
// uiWorkspace services (the real ones were checked on dsh 0.2.2-rc.3), timers run at once.
const scenario = JSON.parse(process.argv[3]);
let mod; const calls = [];
const el = (t, p, ...c) => ({t, p, c});
const React = {createElement: el, Fragment: 'F', useRef: () => ({current: null}), useEffect: () => {}};
const store = Object.assign({}, scenario.storage || {});
globalThis.window = {__ModuleLoader__: {load: ({id, factory}) => { mod = {id, exports: factory(n => n === 'react' ? React : null)}; }},
  localStorage: {getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }}};
globalThis.document = {title: 'x', head: {appendChild() {}}, querySelector: () => null, createElement: () => ({setAttribute() {}, getAttribute() {}})};
globalThis.MutationObserver = class { observe() {} disconnect() {} };
const realTimeout = setTimeout;
globalThis.setTimeout = (f) => realTimeout(f, 0);
require(process.argv[2]);
let ws = 0;
const services = {
  workspaces: {create: async ({path}) => ({workspaceId: 'ws:' + path, title: 'work'}), rename: async () => {}},
  uiWorkspace: {startSession: (id, opts) => calls.push([id, opts && opts.agentPreset])},
  sessions: scenario.noSessionsApi ? undefined : {list: {getSnapshot: () => ({byId: scenario.byId || {}})}},
};
const ctx = {slots: {inject: (n, f) => { const r = f(); if (r && r.next) for (const _ of r) {} }, register: () => () => {}},
             on() {}, get: n => services[n]};
mod.exports.apply(ctx);
realTimeout(() => console.log(JSON.stringify({calls, last: store['babykalki.lastCitizen'] || null})), 300);
"""


@pytest.mark.parametrize("scenario,expect,last", [
    ({}, [["ws:/data/citizens/warden/work", "bk-warden"]], "warden"),                     # first visit: the Warden, ready
    ({"storage": {"babykalki.lastCitizen": "librarian"}}, [["ws:/data/citizens/librarian/work", "bk-librarian"]], "librarian"),
    ({"storage": {"babykalki.lastCitizen": "nobody"}}, [["ws:/data/citizens/warden/work", "bk-warden"]], "warden"),
    ({"byId": {"s1": {"retainedBy": {"mainView": 1}, "blank": False, "cwd": "/data/citizens/scout/work"}}}, [], None),
    ({"byId": {"s1": {"retainedBy": {"mainView": 1}, "blank": True, "cwd": "/data/citizens/scout/work",
                      "projectionValues": {"agentPreset": "bk-scout"}}}}, [], None),          # right citizen: kept
    ({"byId": {"s1": {"retainedBy": {"mainView": 1}, "blank": True, "cwd": "/data/citizens/scout/work",
                      "projectionValues": {"agentPreset": "bk-warden"}}}}, [["ws:/data/citizens/scout/work", "bk-scout"]], "scout"),
    ({"noSessionsApi": True}, [], None),                                                   # unknown dsh: leave it alone
])
def test_home_opens_ready_to_type(tmp_path, scenario, expect, last):
    if not shutil.which("node"):
        pytest.skip("node not found")
    (tmp_path / "client.js").write_text(B.render_client(TPL_JS, B.data(CARDS, {}, skills_dir=SKILLS, version=S.VERSION)))
    (tmp_path / "h.cjs").write_text(OPEN_HARNESS)
    out = subprocess.run(["node", str(tmp_path / "h.cjs"), str(tmp_path / "client.js"), json.dumps(scenario)],
                         capture_output=True, text=True, timeout=30)
    assert out.returncode == 0, out.stderr
    r = json.loads(out.stdout.strip().splitlines()[-1])
    assert r["calls"] == expect and r["last"] == last, r
