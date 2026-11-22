#!/usr/bin/env python3
"""bk_status.py — publishes the PUBLIC status page from a fixed template (v0.5, 19 Nov 2026: + community desk state and counts,
telemetry OFF/ALLOWED, Librarian round state + time, approvals mode + pending count, citizen presets). MIT licence.

Rule 1 says the founder approves anything that leaves the system. The public status page is the ONE stated exception,
and it is safe by construction: every field is a whitelisted count, enum or timestamp, checked here; there is no free
text and nothing a citizen writes. It runs as the infra user and is the only writer of /data/site/public.
Tested: tests/test_static_status.py.
"""
import datetime as dt, html, json, os, re, sys, tempfile, urllib.request
VERSION = "v1.3"   # must equal site-src/build.py VERSION (build refuses otherwise)

HERE = os.path.dirname(os.path.abspath(__file__))
# v0.8 (R1-42): a fixed icon written next to the page (allowed by the page's img-src 'self'; nothing a citizen writes)
FAVICON = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M16 27C10 24 9 15 16 6c7 9 6 18 0 21z' fill='#7C6CFF'/>"
           "<path d='M16 27C9 26 4 19 5 12c6 2 10 8 11 15z' fill='#4B3FD6' opacity='.8'/>"
           "<path d='M16 27c7-1 12-8 11-15-6 2-10 8-11 15z' fill='#4B3FD6' opacity='.8'/><circle cx='16' cy='24' r='2' fill='#E8B339'/></svg>\n")
D = os.environ.get("BK_DATA", "/data")
ENUMS = {
    "system_state": {"STARTING", "RUNNING", "STOPPED", "STOPPING", "DISK_LOW", "WAITING_FOR_BACKUP", "DEGRADED",
                     "WAITING_FOR_LEASE", "LEASE_LOST", "LEASE_UNCONFIRMED"},
    "backup_state": {"OK", "UNREACHABLE", "INCONSISTENT", "RESTORE_FAILED", "RESTORED_WITH_WARNINGS", "PUSH_FAILED",
                     "NOT_RESTORED", "UNKNOWN", "LEASE_BUSY", "LEASE_LOST", "NO_LEASE"},
    "restore_test": {"PASS", "FAIL", "NOT_RUN"},
    "version": {"v0.3", "v0.4", "v0.5", "v0.6", "v0.7", "v0.8", "v0.9", "v1.0", "v1.1", "v1.2", "v1.3"},
    "community_state": {"OFF", "STARTING", "ON", "ERROR"},
    "telemetry": {"OFF", "ALLOWED"},
    "librarian_round": {"IDLE", "RUNNING", "OK", "SKIPPED", "FAILED", "TIMEOUT", "ERROR"},
    "approvals_mode": {"FOUNDER_ONLY", "ADVISORY", "NO_FOUNDER_EMAILS"},
    "citizen_presets": {"ON", "OFF", "FALLBACK", "ERROR"},
}
COUNTS = ("facts_live", "proposals_pending", "tasks_open", "tasks_overdue", "connections", "connections_red", "diary_files",
          "community_answered", "community_escalated", "community_spam_removed", "approvals_pending")
TIMES = ("generated_at", "last_backup_at", "restore_test_at", "librarian_round_at")
TS = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$")


def _load(p):
    try:
        return json.load(open(p))
    except Exception:
        return {}


def gather():
    sup = _load(os.path.join(D, "run", "supervisor-state.json"))
    bk = _load(os.path.join(D, "run", "backup-state.json"))
    rt = _load(os.path.join(D, "log", "restore-test.json"))
    anc = _load(os.path.join(D, "run", "last-anchors.json"))
    stats = {}
    try:
        req = urllib.request.Request(os.environ.get("BK_LIBRARY_ADMIN", "http://127.0.0.1:7802") + "/stats",
                                     headers={"X-Admin-Token": os.environ.get("LIBRARY_ADMIN_TOKEN", "")})
        stats = json.load(urllib.request.urlopen(req, timeout=10))
    except Exception:
        pass
    comm = sup.get("community") or {}
    today = comm.get("today") or {}
    cnt = lambda *ks: sum(today.get(k, 0) for k in ks) if comm.get("state") not in (None, "OFF") or today else None  # noqa: E731
    lr = sup.get("librarian_round") or {}
    return {"system_state": sup.get("state", "STARTING"), "community_state": comm.get("state", "OFF"),
            "telemetry": sup.get("telemetry"), "librarian_round": lr.get("state"), "librarian_round_at": lr.get("last_at"),
            "approvals_mode": sup.get("approvals"), "citizen_presets": (sup.get("citizen_presets") or {}).get("state"),
            "community_answered": cnt("answered_llm", "answered_kb"), "community_escalated": cnt("escalated"),
            "community_spam_removed": cnt("spam_deleted"), "backup_state": bk.get("state", "UNKNOWN"),
            "last_backup_at": bk.get("last_push"), "restore_test": ("PASS" if rt.get("ok") else "FAIL") if rt else "NOT_RUN",
            "restore_test_at": rt.get("at"), "diary_files": len(anc.get("anchors", {})),
            "generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "version": VERSION,
            **{k: stats.get(k) for k in COUNTS if k != "diary_files" and not k.startswith("community_")}}


def clean(fields):
    """Whitelist: unknown keys dropped; enums must match; counts must be ints; times must be ISO-8601 UTC."""
    out = {}
    for k, allowed in ENUMS.items():
        v = fields.get(k)
        out[k] = v if v in allowed else ("UNKNOWN" if k == "backup_state" else "—")
    for k in COUNTS:
        v = fields.get(k)
        out[k] = str(v) if isinstance(v, int) and not isinstance(v, bool) and 0 <= v < 10**9 else "—"
    for k in TIMES:
        v = fields.get(k)
        out[k] = v if isinstance(v, str) and TS.match(v) else "—"
    return out


def render(template, fields):
    vals = clean(fields)
    names = set(re.findall(r"\{\{(\w+)\}\}", template))
    unknown = names - set(vals)
    if unknown:
        raise SystemExit(f"template uses fields that are not whitelisted: {sorted(unknown)}")
    return re.sub(r"\{\{(\w+)\}\}", lambda m: html.escape(vals[m.group(1)]), template), vals


def publish(out_dir=None, template_path=None, fields=None):
    out_dir = out_dir or os.path.join(D, "site", "public")
    template_path = template_path or os.path.join(HERE, "site", "status-template.html")
    page, vals = render(open(template_path, encoding="utf-8").read(), gather() if fields is None else fields)
    os.makedirs(out_dir, exist_ok=True)
    for name, data in (("index.html", page), ("status.json", json.dumps(vals, indent=1)), ("favicon.svg", FAVICON)):
        # v0.8 (erratum 26): a temp file of its own per publish — two publishes at once used to share ".index.html.tmp",
        # and the second os.replace failed (FileNotFoundError). Each one is still atomic; the last one wins.
        fd, tmp = tempfile.mkstemp(dir=out_dir, prefix="." + name + ".", suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(data)
            os.chmod(tmp, 0o644)
            os.replace(tmp, os.path.join(out_dir, name))
        except BaseException:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise
    return vals


if __name__ == "__main__":
    print(json.dumps(publish(*(sys.argv[1:3] or [None]))))
