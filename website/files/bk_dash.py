#!/usr/bin/env python3
"""bk_dash.py — the BabyKalki private dashboard for the dsh web UI (v0.7, 20 Nov 2026). MIT licence.

bk_supervisor.py calls install() at every start (before dsh starts):
  1. writes the browser plugin /run/bk/dash/bk-dashboard/ (package.json, index.mjs, client.js) from /opt/bk/dash/bk-dashboard/,
     filling client.tpl.js with the six citizens (display names from the self cards, sanitised by bk_presets.display_name),
     their roles, blurbs, preset ids and work folders, and the links (approvals, status page, guide);
  2. returns the cordis row that loads it (appended to $DSH_HOME/cordis.patch.yml like the presets);
  3. copies the founder's slash commands (dsh skills) from /opt/bk/dash/skills/<name>/SKILL.md to $DSH_HOME/skills/<name>/.
Settings: BK_DASHBOARD=0 (no plugin row), BK_DASH_SKILLS=0 (no skills written), BK_STATUS_URL, BK_GUIDE_URL, BK_COMMUNITY_URL.
Only sanitised names and URLs from the founder's own settings (plus the version and the time this config was written —
"BabyKalki restarted at …" on the home page for an hour) reach the browser code; everything is JSON-encoded (ASCII).
v0.7.1 (R2-06): the browser half opens a ready session with the Warden (or the citizen last picked in that browser) when dsh
would show "Choose a workspace to start".
The plugin lives under /run/bk (root-owned) so the citizens' Linux user cannot rewrite what the founder's browser runs.
Tested: tests/test_dash.py (rendering, rows, skills) and on real dsh 0.2.2-rc.3 (local web boot, 20 Nov 2026).
"""
import datetime as dt, json, os, re, shutil

import bk_presets

PKG = "bk-dashboard"
ROW_ID = "babykalki-dashboard"
MARK = re.compile(r"/\*@@BK_DATA@@\*/[^\n]*;")
DEFAULT_GUIDE = "https://bk.openkalki.org/"
URL_RE = re.compile(r"^(https://[A-Za-z0-9.\-]+(:\d+)?(/[A-Za-z0-9._~/\-%#?=&+]*)?|/[A-Za-z0-9._~/\-]*)$")
LOTUS = ('<svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bklg" x1="0" y1="0" x2="0" y2="1">'
         '<stop offset="0" stop-color="#E4DCFF"/><stop offset=".55" stop-color="#8E7DFF"/><stop offset="1" stop-color="#4B3FD6"/></linearGradient></defs>'
         '<path d="M16 27C7 25 3 18 4 11c6 2 11 8 12 16z" fill="#4B3FD6" opacity=".7"/>'
         '<path d="M16 27c9-2 13-9 12-16-6 2-11 8-12 16z" fill="#4B3FD6" opacity=".7"/>'
         '<path d="M16 27C10 24 9 14 16 5c7 9 6 19 0 22z" fill="url(#bklg)"/><circle cx="16" cy="24.4" r="1.9" fill="#E8B339"/></svg>')


def enabled(env):
    return (env.get("BK_DASHBOARD") or "1").strip() != "0"


def skills_enabled(env):
    return (env.get("BK_DASH_SKILLS") or "1").strip() != "0"


def safe_url(u):
    """An https URL or a same-site path, else '' (nothing else reaches the page)."""
    u = (u or "").strip()
    return u if u and URL_RE.match(u) and not u.startswith("//") else ""


def links(env, www_has_index=True):
    dom = (env.get("BK_DOMAIN") or "").strip().strip("/")
    status = env.get("BK_STATUS_URL") or (f"https://www.{dom}/" + ("status/" if www_has_index else "") if dom else "")
    return {"approve": "/bk-approve", "status": safe_url(status),
            "guide": safe_url(env.get("BK_GUIDE_URL") or DEFAULT_GUIDE), "community": safe_url(env.get("BK_COMMUNITY_URL") or "")}


def commands(skills_dir):
    """[{name, description}] from the shipped skills' frontmatter (description without the 'BabyKalki: ' prefix)."""
    out = []
    if not os.path.isdir(skills_dir):
        return out
    for n in sorted(os.listdir(skills_dir)):
        p = os.path.join(skills_dir, n, "SKILL.md")
        if not os.path.isfile(p):
            continue
        head = open(p, encoding="utf-8").read().split("---", 2)
        meta = dict(re.findall(r'^(\w[\w-]*):\s*"?(.*?)"?\s*$', head[1], re.M)) if len(head) == 3 else {}
        if meta.get("name") == n:
            out.append({"name": n, "description": re.sub(r"^BabyKalki:\s*", "", meta.get("description", ""))})
    return out


def data(cards, env, citizens_dir="/data/citizens", skills_dir="", version="", every_min=10, www_has_index=True,
         presets_on=True, started_at=None):
    """started_at: when this dsh config was written (= when BabyKalki last (re)started dsh), ISO UTC; default now."""
    cit = []
    for c in bk_presets.CITIZENS:
        disp = bk_presets.display_name(cards.get(c, ""), c)
        name = disp.split(" · ")[0] if " · " in disp else ""
        cit.append({"role": c, "title": bk_presets.TITLE[c], "name": name, "display": disp, "blurb": bk_presets.WHAT[c],
                    "preset": f"bk-{c}" if presets_on else "", "path": os.path.join(citizens_dir, c, "work"),
                    "isDefault": c == "warden"})
    return {"product": "BabyKalki", "version": version or "dev", "citizens": cit, "links": links(env, www_has_index),
            "commands": commands(skills_dir), "roundEvery": int(every_min), "lotus": LOTUS,
            "startedAt": started_at or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}


def render_client(tpl, d):
    """client.tpl.js with the data filled in. Raises ValueError if the template has no (or more than one) data marker."""
    if len(MARK.findall(tpl)) != 1:
        raise ValueError("client template must contain exactly one /*@@BK_DATA@@*/ marker line")
    blob = json.dumps(d, ensure_ascii=True, separators=(",", ":")).replace("</", "<\\/")
    return MARK.sub(lambda _m: "/*BK_DATA*/" + blob + ";", tpl)


def row(dest_pkg_dir):
    return (f"\n# 5b) The BabyKalki dashboard plugin — written by bk_supervisor.py (bk_dash.py, BK_DASHBOARD); do not edit here.\n"
            f"- insert:\n"
            f"    - id: {ROW_ID}\n"
            f"      name: {os.path.join(dest_pkg_dir, 'index.mjs')}\n")


def _put(path, text, mode=0o644):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    os.chmod(tmp, mode)
    os.replace(tmp, path)


def install_plugin(ship_dash, dest_root, d):
    """Copy the package to <dest_root>/bk-dashboard and write client.js. Returns the package dir."""
    src = os.path.join(ship_dash, PKG)
    dst = os.path.join(dest_root, PKG)
    os.makedirs(dst, exist_ok=True)
    os.chmod(dest_root, 0o755); os.chmod(dst, 0o755)
    for n in ("package.json", "index.mjs"):
        _put(os.path.join(dst, n), open(os.path.join(src, n), encoding="utf-8").read())
    _put(os.path.join(dst, "client.js"), render_client(open(os.path.join(src, "client.tpl.js"), encoding="utf-8").read(), d))
    return dst


def install_skills(skills_src, skills_dst, chown=None):
    """Write the shipped skills into $DSH_HOME/skills/<name>/SKILL.md (ours only; other folders are the founder's)."""
    done = []
    if not os.path.isdir(skills_src):
        return done
    os.makedirs(skills_dst, exist_ok=True)
    if chown:
        chown(skills_dst)
    for n in sorted(os.listdir(skills_src)):
        s = os.path.join(skills_src, n, "SKILL.md")
        if not os.path.isfile(s):
            continue
        dd = os.path.join(skills_dst, n)
        os.makedirs(dd, exist_ok=True)
        _put(os.path.join(dd, "SKILL.md"), open(s, encoding="utf-8").read())
        if chown:
            chown(dd); chown(os.path.join(dd, "SKILL.md"))
        done.append(n)
    return done


def remove_plugin(dest_root):
    shutil.rmtree(os.path.join(dest_root, PKG), ignore_errors=True)
