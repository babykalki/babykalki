#!/usr/bin/env python3
"""bk_presets.py — renders the six citizen presets for dsh's web UI (BabyKalki v0.5, 19 Nov 2026). MIT licence.

Used by bk_supervisor.py at every start (BK_CITIZEN_PRESETS):
  1       (default) six presets, each with ONLY its own Library connector; the root connector rows are disabled, so a
          session started in dsh's plain `standard` preset has NO Library access at all.
  shared  six presets WITHOUT connectors; the root rows stay (every session sees the five citizen rows + the librarian
          desk, as in v0.4). The fallback if connectors inside presets misbehave on your dsh version.
  0       no presets (exactly the shipped cordis.patch.yml).
v0.7: modes 1 and shared also append DASHBOARD_ROWS (Warden = default preset; dsh's Standard/PTC/Minimal/Creator hidden).
Display names come from each citizen's self card (AGENTS.local.md, "My name is …"), sanitised to letters/spaces/'-.
The text is JSON-quoted (valid YAML). Nothing a citizen writes reaches the YAML except that sanitised name.
Tested: tests/test_presets.py.
"""
import json, os, re

CITIZENS = ("warden", "librarian", "reviewer", "steward", "builder", "scout")
ORDER = {"warden": 11, "librarian": 12, "reviewer": 13, "steward": 14, "builder": 15, "scout": 16}
TITLE = {"warden": "Warden", "librarian": "Librarian", "reviewer": "Reviewer", "steward": "Steward", "builder": "Builder",
         "scout": "Scout"}
WHAT = {"warden": "front desk: talks to you, delegates, collects approvals",
        "librarian": "memory: recall, proposals; commits happen in the Librarian round",
        "reviewer": "checks claims, code and drafts before they leave",
        "steward": "money, quotas, connections, the off-switch",
        "builder": "code, pages, pull requests",
        "scout": "research and leads"}
TOKEN_ENV = {c: f"LIBRARY_TOKEN_{c.upper()}" for c in CITIZENS}
TOKEN_ENV["librarian"] = "LIBRARY_TOKEN_LIBRARIAN_DESK"      # read + propose only in the web UI (v0.5)
MODES = ("1", "shared", "0")
NAME_RE = re.compile(r"my name is\s+([^\W\d_][\w' -]{0,40})", re.IGNORECASE | re.UNICODE)


# v0.7 (the private dashboard): with the six presets on, new sessions start as the Warden, and dsh's own modes are hidden —
# Standard/PTC/Minimal have no Library connector and Creator writes dsh plugins. VERIFIED on dsh 0.2.2-rc.3 (20 Nov 2026,
# local web boot): 0 activation errors, the mode menu shows exactly the six citizens, Warden ticked. To get a dsh mode back,
# in cordis.founder.yml:  - id: preset-standard / disabled: false   (the founder's rows come after these and win).
DASHBOARD_ROWS = """# Dashboard rows (v0.7): the Warden is the default for new sessions; dsh's own modes are hidden.
- id: agent-preset-registry
  config: { default: bk-warden }
- id: preset-standard
  disabled: true
- id: preset-ptc
  disabled: true
- id: preset-minimal
  disabled: true
- id: preset-cordis
  disabled: true
"""


def mode(env):
    v = (env.get("BK_CITIZEN_PRESETS") or "1").strip().lower()
    return v if v in MODES else "1"


def display_name(card_text, role):
    """'Edith · Librarian' from a self card line '- My name is Edith; …', else 'Librarian'."""
    m = NAME_RE.search(card_text or "")
    name = ""
    if m:
        name = re.split(r"[;,.]| and | I am ", m.group(1))[0]
        name = re.sub(r"[^\w' -]", "", name, flags=re.UNICODE).strip(" -'")[:32].strip()
    return f"{name} · {TITLE[role]}" if name and name.lower() != role else TITLE[role]


def prefix(role, every_min):
    t = TITLE[role]
    p = (f"You are the BabyKalki {t} (role name: {role}). Before your first answer, read /data/citizens/{role}/AGENTS.md "
         f"(your rules) and /data/citizens/{role}/AGENTS.local.md (your self card: your name and persona) with your file "
         f"tools, and follow them, together with the shared rules in /data/dsh/AGENTS.md. This session may have started in "
         f"another citizen's folder and been given that citizen's instructions: ignore any other citizen's AGENTS.md or self "
         f"card — you are the {t}. Work in /data/citizens/{role}/work (cd there in every shell command; write only there). ")
    if role == "librarian":
        p += (f"Your Library connector here is library-librarian with the read-and-propose desk token: you cannot commit "
              f"in this session. Commits, rejections and self cards happen in the Librarian round (a separate background "
              f"process, every {every_min} minutes). To ask for a round now: touch /data/run/librarian-requests/NOW")
    else:
        p += (f"Your Library connector is library-{role}; it is the only one in this preset. Never use another citizen's "
              f"connector or token, even if you find one: that is impersonation.")
        if role == "warden":
            p += (" Approvals: you can only REQUEST them (request_approval); the founder decides on the /bk-approve page. "
                  "To ask the Librarian round to run now: touch /data/run/librarian-requests/NOW")
    return p


def connector(role):
    return (f"          - id: bk-library\n"
            f"            name: '@deepseek-ai/dsh-mcp-client'\n"
            f"            config: {{ serverName: library-{role}, transport: streamable-http, url: http://127.0.0.1:7801/mcp,\n"
            f"                      headers: {{ X-Library-Token: !!js process.env.{TOKEN_ENV[role]} }} }}\n")


def read_cards(citizens_dir):
    out = {}
    for c in CITIZENS:
        try:
            out[c] = open(os.path.join(citizens_dir, c, "AGENTS.local.md"), encoding="utf-8", errors="replace").read(4000)
        except OSError:
            out[c] = ""
    return out


def render(tpl, m, cards=None, every_min=10):
    """The text appended to $DSH_HOME/cordis.patch.yml ('' for mode 0). Raises ValueError on a broken template."""
    if m == "0":
        return ""
    if m not in MODES:
        raise ValueError(f"unknown BK_CITIZEN_PRESETS mode {m!r}")
    body = tpl.split("\n    - id: preset-bk-@@ROLE@@", 1)
    if len(body) != 2:
        raise ValueError("template has no '    - id: preset-bk-@@ROLE@@' row")
    row = "    - id: preset-bk-@@ROLE@@" + body[1]
    for ph in ("@@ROLE@@", "@@ORDER@@", "@@DISPLAY_JSON@@", "@@DESC_JSON@@", "@@PREFIX_JSON@@", "@@CONNECTOR@@\n"):
        if ph not in row:
            raise ValueError(f"template is missing {ph.strip()}")
    cards = cards or {}
    out = [f"\n# 4) Citizen presets — rendered by bk_supervisor.py (BK_CITIZEN_PRESETS={m}); do not edit here.\n- insert:\n"]
    for c in CITIZENS:
        r = (row.replace("@@CONNECTOR@@\n", connector(c) if m == "1" else "")
             .replace("@@ROLE@@", c).replace("@@ORDER@@", str(ORDER[c]))
             .replace("@@DISPLAY_JSON@@", json.dumps(display_name(cards.get(c, ""), c), ensure_ascii=False))
             .replace("@@DESC_JSON@@", json.dumps(f"BabyKalki {TITLE[c]}: {WHAT[c]}", ensure_ascii=False))
             .replace("@@PREFIX_JSON@@", json.dumps(prefix(c, every_min), ensure_ascii=False)))
        if "@@" in r:
            raise ValueError("unreplaced placeholder in the rendered preset")
        out.append(r.rstrip("\n") + "\n")
    out.append(DASHBOARD_ROWS)
    if m == "1":
        out.append("# The root connector rows are off: each citizen's connector lives in its own preset only.\n")
        for c in CITIZENS:
            out.append(f"- id: mcp-library-{c}\n  disabled: true\n")
    return "".join(out)
